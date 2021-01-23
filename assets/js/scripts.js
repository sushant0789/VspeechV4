$(document).ready(function() {
  new WOW().init();

  $(".toggle-menu").click(function() {
    $("nav").css("transform", "translateX(0)");
    $("#background-for-menu").fadeIn(300);
    $("nav ul li a").addClass("mobile");
  });

  $("nav ul li a").click(function() {
    $("nav ul li a").removeClass("active");
    $(this).addClass("active");
  });

  $(document).on("click", "nav ul li a.mobile", function(e) {
    $("nav ul li a").removeClass("active");
    $(this).addClass("active");
    $("nav").css("transform", "translateX(100%)");
    $("#background-for-menu").fadeOut();
    $("nav ul li a").removeClass("mobile");

    jQuery("html,body").animate(
      { scrollTop: jQuery(this.hash).offset().top - 50 },
      1000
    );
    return false;
    e.preventDefault();
  });

  $(".links-wrap li a").click(function() {
    jQuery("html,body").animate(
      { scrollTop: jQuery(this.hash).offset().top - 50 },
      1000
    );
    return false;
    e.preventDefault();
  });

  $("#background-for-menu").click(function() {
    $("nav").css("transform", "translateX(100%)");
    $(this).fadeOut();
    $("nav ul li a").removeClass("mobile");
  });

  $(window).scroll(function() {
    if ($(this).scrollTop() > 1000) {
      $(".bottom-to-top").fadeIn();
    } else {
      $(".bottom-to-top").fadeOut();
    }
  });

  // scroll body to 0px on click
  $(".bottom-to-top").click(function() {
    $("body,html").animate(
      {
        scrollTop: 0
      },
      700
    );
    return false;
  });

  var animTime = 300,
    clickPolice = false;

  $(document).on("touchstart click", ".acc-btn", function() {
    if (!clickPolice) {
      clickPolice = true;

      var currIndex = $(this).index(".acc-btn"),
        targetHeight = $(".acc-content-inner")
          .eq(currIndex)
          .outerHeight();

      $(".acc-btn h4").removeClass("selected");
      $(this)
        .find("h4")
        .addClass("selected");

      $(".acc-content")
        .stop()
        .animate({ height: 0 }, animTime);
      $(".acc-content")
        .eq(currIndex)
        .stop()
        .animate({ height: targetHeight }, animTime);

      setTimeout(function() {
        clickPolice = false;
      }, animTime);
    }
  });
});
