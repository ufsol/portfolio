(function () {

    var port = angular.module("port", ["ngRoute", "ngAnimate"]);

    port.config(function($routeProvider, $locationProvider) {

      $locationProvider.html5Mode(true);

      $routeProvider
        .when("/", {
          controller: "firstCont",
          templateUrl: "views/home.htm"
        })
        .when("/about", {
          controller: "firstCont",
          templateUrl: "views/about.htm"
        })
        .when("/contact", {
          controller: "firstCont",
          templateUrl: "views/contact.htm"
        })
        .otherwise({redirectTo: "/"});
    });

    port.controller("firstCont", function ($scope, $http) {
      $scope.pop = function() {
        $('[data-toggle="tooltip"]').tooltip();
      };
      $scope.click = function() {
        $("#dropdownMini").removeClass("shown").addClass("myhidden");
        $("#optionsMini i").removeClass("fa-times").addClass("fa-bars");
      };

      $http.get( "/submit").success(function( data ) {
        $scope.data = data;
      });

      $scope.$on("$routeChangeSuccess", function () {
          $("#dropdown").removeClass("shown").addClass("myhidden");
          $("#dropdownMini").removeClass("shown").addClass("myhidden");
          $("#optionsMini i").removeClass("fa-times").addClass("fa-bars");
          $("#xxx i").removeClass("fa-arrow-up").addClass("fa-arrow-down");
      });

    });

}());
