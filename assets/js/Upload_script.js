var api_url = "https://vspeech.ai/api"
var audioContext = null;
var audioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null;
// var canvasWidth, canvasHeight;
var recIndex = 0;
var tmpBuffer = '';

$('#dfl-txt').show();
$('#result-txt').hide();
$('.speech-loader').hide();
$('.timerCls').hide();

var IP = '';
$.getJSON("https://jsonip.com?callback=?", function(data) {
    IP = data ? data.ip : '';
});

$(document).ready(function() {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();

    audioContext.onstatechange = function() {
        console.log(audioContext.state);
    }
    var MicPermission = false;

    function checkMic(cb){
        if(MicPermission){
            cb(true);
            return;
        }
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            console.log('getUserMedia supported.');
            navigator.mediaDevices.getUserMedia({
                    audio: true
                })
                .then(function (stream) {
                    inputPoint = audioContext.createGain();

                    // Create an AudioNode from the stream.
                    audioInput = audioContext.createMediaStreamSource(stream);
                    audioInput.connect(inputPoint);

                    analyserNode = audioContext.createAnalyser();
                    analyserNode.fftSize = 2048;
                    inputPoint.connect(analyserNode);

                    audioRecorder = new Recorder(inputPoint);

                    zeroGain = audioContext.createGain();
                    zeroGain.gain.value = 0.0;
                    inputPoint.connect(zeroGain);
                    zeroGain.connect(audioContext.destination);
                    MicPermission = true;
                    cb(true);
                })
                .catch( function(e) {
                    cb(false);
                    console.log(e);
                });
        } else {
            console.log('getUserMedia not supported on your browser!');
        }
    }


    


    readText = function(buf, start, length) {
        var a = new Uint8Array(buf, start, length);
        var str = '';
        for (var i = 0; i < a.length; i++) {
            str += String.fromCharCode(a[i]);
        }
        return str;
    };

    readDecimal = function(buf, start, length) {
        var a = new Uint8Array(buf, start, length);
        return this.fromLittleEndianDecBytes(a);
    };

    fromLittleEndianDecBytes = function(a) {
        var sum = 0;
        for (var i = 0; i < a.length; i++)
            sum |= a[i] << (i * 8);
        return sum;
    };

    function isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    $('#dfl-txt').show();
    $('#result-txt').hide();
    $('.speech-loader').hide();
    $('.timerCls').hide();

    function sendBase64(audio_base64) {
        $('.speech-loader').show();
        $('#result-txt').hide();
        $('#dfl-txt').hide();
        var jsonObj = {
                command: 'transcribe',
                model: document.getElementById("lang").value,
                audio_base64: audio_base64
            }
        $.ajax({
            url: api_url+'/recognize',
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(jsonObj),
            dataType: 'json',
            success: function(response) {

                let saveData = {
                    'log_from': 'vspeech',
                    'res_text': '',
                    'convert_text': '',
                    'process_time': 0,
                    'data_type': 'base64',
                    'model': jsonObj.model,
                    'command': jsonObj.command,
                    'data_base64': tmpBuffer ? tmpBuffer : audio_base64,
                    'data_raw': '',
                    'user': 2,
                    'ip':IP,
                    'type': 'success'
                };
                
                $('.speech-loader').hide();
                $('#result-txt').show();

                if(response.status){
                    if (response.data['status'] === "success") {
                        $("#result-txt").text(response.data.alternatives[0]['transcript']);
                        saveData['convert_text'] = response.data.alternatives[0]['transcript'];
                        saveData['process_time'] = response.data.processing_time;
                    } else {
                        $("#result-txt").text("Something went wrong, Please try again later..!");
                        saveData.type = 'error';
                        saveData['convert_text'] = response.data.status;
                    }

                    $.ajax({
                        url: api_url+'/log',
                        type: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(saveData),
                        dataType: 'json',
                        success: function(response) {},
                        error: function(request, response) {},
                        complete: function(response) {}
                    });
                }else{
                    $("#result-txt").text(response.error);
                }
            },
            error: function(request, response) {
                $('#result-txt').show();
                $('.speech-loader').hide();

                $("#result-txt").text("Connection Error Occured.");
            },
            complete: function(response) {}
        });
    }

    function tmp_sendBlob(blob) {
        var reader = new FileReader();
        reader.onloadend = function() {
            tmpBuffer = reader.result;
        }
        reader.readAsDataURL(blob);
    }

    function sendBlob(blob) {
        var reader = new FileReader();
        reader.onloadend = function() {
            audio_base64 = reader.result;
            sendBase64(audio_base64);
        }
        reader.readAsDataURL(blob);
    }

    function saveAudio(blob) {
        url = window.URL.createObjectURL(blob);
        // html = "<div class='col-md-3'><div ><div class='request-recoding pull-right'><audio controls src='" + url + "'></audio></div></div>";
        // $("#resultDiv").append(html);
        tmp_sendBlob(blob);
        audioRecorder.exportMonoWAV(sendBlob);
    }

    function saveAudio_File(blob) {
        url = window.URL.createObjectURL(blob);
        // html = "<div class='col-md-3'><div ><div class='request-recoding pull-right'><audio controls src='" + url + "'></audio></div></div>";
        // $("#resultDiv").append(html);
        sendBlob(blob);
    }

    function gotBuffers(buffers) {
        audioRecorder.exportWAV(saveAudio);
    }

    var interval = '';
    function setTimer(){
        $('.timerCls > span').text(10)
        var time = 0;
        var i = 10

        interval = setInterval(function() {
                $('.timerCls > span').text(i);
                if (i == time) {      
                    stopRecord();
                    i=10;
                    return;
            }
            i--;  
        }, 1000);
    }

    function startRecord(){
        audioContext.resume().then(() => {
            audioRecorder.clear();
            $('.timerCls').show();
            setTimer();
            audioRecorder.record();
        });
    }

    function stopRecord(){
        $('.timerCls').hide();
        audioRecorder.stop();
        clearTimeout(interval);
        audioRecorder.getBuffers(gotBuffers);
    }


    $("#record").click(function() {
        if ($(this).hasClass("sprite-speech-ai")) {
            // stop recording
            $(this).removeClass("sprite-speech-ai");
            $(this).addClass("sprite-mic");
            stopRecord();
        } else {
            var self = $(this);
            checkMic( function(stat){
                // start recording
                if (!audioRecorder){
                    return;
                }
                self.addClass("sprite-speech-ai");
                self.removeClass("sprite-mic");
                startRecord();
            });
        }
    });
});