(function (){

  var up = "fa-arrow-up";
  var down = "fa-arrow-down";
  var icoOpen = "fa-bars";
  var icoClosed = "fa-times";


  //media query for screen size

  if ( $(window).width() <= 980 ) {
        $("#options").hide();
  }

  else if ( $(window).width() > 980 ) {
        $("#optionsMini").hide();
  }

  $( window ).resize(function() {
      if ( $(window).width() <= 980 ) {
        $("#options").hide();
        $("#optionsMini").show();
        $("#dropdown").removeClass("shown").addClass("myhidden");
      }

      else if ( $(window).width() > 980 ) {
        $("#optionsMini").hide();
        $("#options").show();
        $("#dropdownMini").removeClass("shown").addClass("myhidden");
        $("#optionsMini i").removeClass(icoClosed).addClass(icoOpen);
        $("#xxx i").removeClass(up).addClass(down);
      }
  });

  //dropdown menu control

  $("#xxx").click(function(e) {

       if ( $("#dropdown").hasClass("myhidden") ) {
            $("#dropdown").removeClass("myhidden").addClass("shown");
       }

       else {
            $("#dropdown").removeClass("shown").addClass("myhidden");
       }

       if ( $("#xxx i").hasClass(down) ) {
            $("#xxx i").removeClass(down).addClass(up);
       }

       else {
            $("#xxx i").removeClass(up).addClass(down);
       }

  });

  $(".navbar-default").mouseleave(function(e) {
        $("#dropdown").removeClass("shown").addClass("myhidden");
        $("#xxx i").removeClass(up).addClass(down);
  });

  //dropdown mini menu control

  $("#optionsMini").click(function(e) {
      if ( $("#dropdownMini").hasClass("myhidden") ) {
           $("#dropdownMini").removeClass("myhidden").addClass("shown");
       }

       else {
           $("#dropdownMini").removeClass("shown").addClass("myhidden");
           $("#projects").removeClass("shown").addClass("hidden");
       };

       if ( $("#optionsMini i").hasClass(icoOpen) ) {
            $("#optionsMini i").removeClass(icoOpen).addClass(icoClosed);
       }

       else {
           $("#optionsMini i").removeClass(icoClosed).addClass(icoOpen);
           $("#xyz i").removeClass(up).addClass(down);
       }
  });

  //dropdown mini branch control

  $("#xyz").click(function(e) {
      if ( $("#projects").hasClass("hidden") ) {
           $("#projects").removeClass("hidden");
       }

       else {
         $("#projects").addClass("hidden");
       };

       if ( $("#xyz i").hasClass(down) ) {
           $("#xyz i").removeClass(down).addClass(up);
       }

       else {
           $("#xyz i").removeClass(up).addClass(down);
       }
  });

}());
