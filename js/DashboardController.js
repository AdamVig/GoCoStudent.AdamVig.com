app.controller('DashboardController', ['$filter', '$sce', '$interval', '$timeout', 'DatabaseFactory', 'DataService', 'LoginService', 'DatabaseConstant', 'NotificationService', function ($filter, $sce, $interval, $timeout, DatabaseFactory, DataService, LoginService, DatabaseConstant, NotificationService) {

  var dashboard = this;
  dashboard.loading = true;
  dashboard.hideSearchResults = true;
  dashboard.sequenceNumber = null;
  dashboard.usersToDisplay = 10;
  dashboard.refreshInterval = 5000;
  dashboard.db = DatabaseConstant;
  dashboard.notifySound = true;

  NotificationService.requestDesktopPermission();

  dashboard.auth = {
    "password": "dashboard",
    "userAttempt": null,
    "wrong": false,
    "authenticated": LoginService.checkLogin()
  };

  // Log in to dashboard
  dashboard.login = function () {
    dashboard.auth = LoginService.login(dashboard.auth);
  };

  // Refresh dashboard data
  dashboard.refreshData = function () {

    dashboard.changed = false;

    DatabaseFactory.getChangesSince(dashboard.sequenceNumber)
    .then(function (response) {

      // Update with latest sequence number
      dashboard.sequenceNumber = response.data.last_seq;

      // If data has changed
      if (response.data.results.length > 0) {

        var oldUsers = dashboard.users;

        dashboard.changed = true;

        // Update users with changes
        dashboard.users = DataService.processChanges(
          dashboard.users.all,
          response.data.results);

        // If new user
        if (dashboard.users.filtered.new.length >
              oldUsers.filtered.new.length) {

          if (dashboard.notifySound) {
            NotificationService.notifySound();
          }

          NotificationService.flashTitle("New user!");
          NotificationService.notifyDesktop(
            "A new user downloaded GoCo Student.",
            "New User!");
        }
      }
    });
  };

  // Wait for page animations to finish
  $timeout(function () {
    // Get current banner
    DatabaseFactory.get('message').then(function (response) {

      if (response.data.body) {
        dashboard.banner = response.data;
        dashboard.banner.body = $sce.trustAsHtml(dashboard.banner.body);
      }

      // Get all users
      return DatabaseFactory.getAll();
    }).then(function (response) {

      dashboard.users = DataService.processAllUsersResponse(response);

      // Get database info
      return DatabaseFactory.getInfo();
    }).then(function (response) {

      dashboard.loading = false;

      // Save update sequence number and start refresh
      if (response.data.update_seq) {
        dashboard.sequenceNumber = response.data.update_seq;
        $interval(dashboard.refreshData, dashboard.refreshInterval);
      }
    });
  }, 1000);


}]);
