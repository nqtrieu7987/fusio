'use strict';

angular.module('fusioApp.rate', ['ngRoute', 'ui.bootstrap'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/rate', {
    templateUrl: 'app/rate/index.html',
    controller: 'RateCtrl'
  });
}])

.controller('RateCtrl', ['$scope', '$http', '$uibModal', 'fusio', function($scope, $http, $uibModal, fusio) {

  $scope.response = null;
  $scope.search = '';

  $scope.load = function() {
    var search = encodeURIComponent($scope.search);

    $http.get(fusio.baseUrl + 'backend/rate?search=' + search).success(function(data) {
      $scope.totalResults = data.totalResults;
      $scope.startIndex = 0;
      $scope.rates = data.entry;
    });
  };

  $scope.pageChanged = function() {
    var startIndex = ($scope.startIndex - 1) * 16;
    var search = encodeURIComponent($scope.search);

    $http.get(fusio.baseUrl + 'backend/rate?startIndex=' + startIndex + '&search=' + search).success(function(data) {
      $scope.totalResults = data.totalResults;
      $scope.rates = data.entry;
    });
  };

  $scope.doSearch = function(search) {
    $http.get(fusio.baseUrl + 'backend/rate?search=' + encodeURIComponent(search)).success(function(data) {
      $scope.totalResults = data.totalResults;
      $scope.startIndex = 0;
      $scope.rates = data.entry;
    });
  };

  $scope.openCreateDialog = function() {
    var modalInstance = $uibModal.open({
      size: 'lg',
      backdrop: 'static',
      templateUrl: 'app/rate/create.html',
      controller: 'RateCreateCtrl'
    });

    modalInstance.result.then(function(response) {
      $scope.response = response;
      $scope.load();
    }, function() {
    });
  };

  $scope.openUpdateDialog = function(rate) {
    var modalInstance = $uibModal.open({
      size: 'lg',
      backdrop: 'static',
      templateUrl: 'app/rate/update.html',
      controller: 'RateUpdateCtrl',
      resolve: {
        rate: function() {
          return rate;
        }
      }
    });

    modalInstance.result.then(function(response) {
      $scope.response = response;
      $scope.load();
    }, function() {
    });
  };

  $scope.openDeleteDialog = function(rate) {
    var modalInstance = $uibModal.open({
      size: 'lg',
      backdrop: 'static',
      templateUrl: 'app/rate/delete.html',
      controller: 'RateDeleteCtrl',
      resolve: {
        rate: function() {
          return rate;
        }
      }
    });

    modalInstance.result.then(function(response) {
      $scope.response = response;
      $scope.load();
    }, function() {
    });
  };

  $scope.closeResponse = function() {
    $scope.response = null;
  };

  $scope.load();

}])

.controller('RateCreateCtrl', ['$scope', '$http', '$uibModalInstance', 'fusio', function($scope, $http, $uibModalInstance, fusio) {

  $scope.rate = {
    priority: 0,
    name: '',
    rateLimit: 1800,
    timespan: '',
    allocation: [{
      routeId: null,
      appId: null,
      authenticated: null,
      parameters: null
    }]
  };

  $scope.timespan = {
    value: 1,
    unit: 'hour'
  };

  $scope.intervals = [{
    key: 'minute',
    value: 'minute'
  }, {
    key: 'hour',
    value: 'hour'
  }, {
    key: 'day',
    value: 'day'
  }, {
    key: 'week',
    value: 'week'
  }, {
    key: 'month',
    value: 'month'
  }];

  $scope.status = [{
    key: null,
    value: 'Yes/No'
  }, {
    key: true,
    value: 'Yes'
  }, {
    key: false,
    value: 'No'
  }];

  $scope.routes = [];
  $scope.apps = [];

  $scope.create = function(rate) {
    var data = angular.copy(rate);
    data.timespan = $scope.getTimespan($scope.timespan);
    data.allocation = $scope.removeNullValuesFromAllocation(rate.allocation);

    $http.post(fusio.baseUrl + 'backend/rate', data)
      .success(function(data) {
        $scope.response = data;
        if (data.success === true) {
          $uibModalInstance.close(data);
        }
      })
      .error(function(data) {
        $scope.response = data;
      });
  };

  $scope.close = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.closeResponse = function() {
    $scope.response = null;
  };

  $scope.getRoutes = function() {
    $http.get(fusio.baseUrl + 'backend/routes').then(function(response) {
      if (angular.isArray(response.data.entry)) {
        var routes = response.data.entry;
        routes.unshift({
          id: null,
          path: 'Every route'
        });
        $scope.routes = routes;
      }
    });
  };

  $scope.getApps = function() {
    $http.get(fusio.baseUrl + 'backend/app').then(function(response) {
      if (angular.isArray(response.data.entry)) {
        var apps = response.data.entry;
        apps.unshift({
          id: null,
          name: 'Every app'
        });
        $scope.apps = apps;
      }
    });
  };

  $scope.addAllocation = function() {
    $scope.rate.allocation.push({
      routeId: null,
      appId: null,
      authenticated: true,
      parameters: null
    });
  };

  $scope.removeAllocation = function(index) {
    var allocation = $scope.rate.allocation;
    allocation.splice(index, 1);
    $scope.rate.allocation = allocation;
  };

  $scope.removeNullValuesFromAllocation = function(allocation) {
    var data = [];
    for (var i = 0; i < allocation.length; i++) {
      data.push($scope.removeNullValuesFromObject(allocation[i]));
    }
    return data;
  };

  $scope.removeNullValuesFromObject = function(object) {
    var row = {};
    for (var key in object) {
      if (object.hasOwnProperty(key) && object[key] !== null) {
        row[key] = object[key];
      }
    }
    return row;
  };

  $scope.getTimespan = function(timespan) {
    if (timespan.unit == 'minute') {
      return 'PT' + timespan.value + 'M';
    } else if (timespan.unit == 'hour') {
      return 'PT' + timespan.value + 'H';
    } else if (timespan.unit == 'day') {
      return 'P' + timespan.value + 'D';
    } else if (timespan.unit == 'week') {
      return 'P' + timespan.value + 'W';
    } else if (timespan.unit == 'month') {
      return 'P' + timespan.value + 'M';
    }
  };

  $scope.getRoutes();
  //$scope.getApps();

}])

.controller('RateUpdateCtrl', ['$scope', '$http', '$uibModalInstance', 'rate', 'fusio', function($scope, $http, $uibModalInstance, rate, fusio) {

  $scope.rate = rate;

  $scope.timespan = {
    value: 1,
    unit: 'hour'
  };

  $scope.intervals = [{
    key: 'minute',
    value: 'minute'
  }, {
    key: 'hour',
    value: 'hour'
  }, {
    key: 'day',
    value: 'day'
  }, {
    key: 'week',
    value: 'week'
  }, {
    key: 'month',
    value: 'month'
  }];

  $scope.status = [{
    key: null,
    value: 'Yes/No'
  }, {
    key: true,
    value: 'Yes'
  }, {
    key: false,
    value: 'No'
  }];

  $scope.routes = [];
  $scope.apps = [];

  $scope.update = function(rate) {
    var data = angular.copy(rate);
    data.timespan = $scope.getTimespan($scope.timespan);
    data.allocation = $scope.removeNullValuesFromAllocation(rate.allocation);

    $http.put(fusio.baseUrl + 'backend/rate/' + rate.id, data)
      .success(function(data) {
        $scope.response = data;
        if (data.success === true) {
          $uibModalInstance.close(data);
        }
      })
      .error(function(data) {
        $scope.response = data;
      });
  };

  $http.get(fusio.baseUrl + 'backend/rate/' + rate.id)
    .success(function(data) {
      $scope.parseTimespan(data.timespan);
      data.allocation = $scope.addNullValuesToAllocation(data.allocation);
      $scope.rate = data;
    });

  $scope.close = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.closeResponse = function() {
    $scope.response = null;
  };

  $scope.getRoutes = function() {
    $http.get(fusio.baseUrl + 'backend/routes').then(function(response) {
      if (angular.isArray(response.data.entry)) {
        var routes = response.data.entry;
        routes.unshift({
          id: null,
          path: 'Every route'
        });
        $scope.routes = routes;
      }
    });
  };

  $scope.getApps = function() {
    $http.get(fusio.baseUrl + 'backend/app').then(function(response) {
      if (angular.isArray(response.data.entry)) {
        var apps = response.data.entry;
        apps.unshift({
          id: null,
          name: 'Every app'
        });
        $scope.apps = apps;
      }
    });
  };

  $scope.addAllocation = function() {
    $scope.rate.allocation.push({
      routeId: null,
      appId: null,
      authenticated: true,
      parameters: null
    });
  };

  $scope.removeAllocation = function(index) {
    var allocation = $scope.rate.allocation;
    allocation.splice(index, 1);
    $scope.rate.allocation = allocation;
  };

  $scope.removeNullValuesFromAllocation = function(allocation) {
    var data = [];
    for (var i = 0; i < allocation.length; i++) {
      data.push($scope.removeNullValuesFromObject(allocation[i]));
    }
    return data;
  };

  $scope.removeNullValuesFromObject = function(object) {
    var row = {};
    for (var key in object) {
      if (object.hasOwnProperty(key) && object[key] !== null) {
        row[key] = object[key];
      }
    }
    return row;
  };

  $scope.addNullValuesToAllocation = function(allocation) {
    var data = [];
    for (var i = 0; i < allocation.length; i++) {
      var row = allocation[i];
      if (!row.hasOwnProperty('routeId')) {
        row.routeId = null;
      }
      if (!row.hasOwnProperty('appId')) {
        row.appId = null;
      }
      if (!row.hasOwnProperty('authenticated')) {
        row.authenticated = null;
      }
      if (!row.hasOwnProperty('parameters')) {
        row.parameters = null;
      }
      data.push(row);
    }
    return data;
  };

  $scope.getTimespan = function(timespan) {
    if (timespan.unit == 'minute') {
      return 'PT' + timespan.value + 'M';
    } else if (timespan.unit == 'hour') {
      return 'PT' + timespan.value + 'H';
    } else if (timespan.unit == 'day') {
      return 'P' + timespan.value + 'D';
    } else if (timespan.unit == 'week') {
      return 'P' + timespan.value + 'W';
    } else if (timespan.unit == 'month') {
      return 'P' + timespan.value + 'M';
    }
  };

  $scope.parseTimespan = function(timespan) {
    var value = 1;
    var unit = 'hour';
    if (timespan.indexOf('T') !== -1) {
      if (timespan.indexOf('H') !== -1) {
        unit = 'hour';
      } else if (timespan.indexOf('M') !== -1) {
        unit = 'minute';
      }
      value = parseInt(timespan.substr(2));
    } else {
      if (timespan.indexOf('M') !== -1) {
        unit = 'month';
      } else if (timespan.indexOf('W') !== -1) {
        unit = 'week';
      } else if (timespan.indexOf('D') !== -1) {
        unit = 'day';
      }
      value = parseInt(timespan.substr(1));
    }

    $scope.timespan = {
      value: value,
      unit: unit
    };
  };

  $scope.getRoutes();

}])

.controller('RateDeleteCtrl', ['$scope', '$http', '$uibModalInstance', 'rate', 'fusio', function($scope, $http, $uibModalInstance, rate, fusio) {

  $scope.rate = rate;

  $scope.delete = function(rate) {
    $http.delete(fusio.baseUrl + 'backend/rate/' + rate.id)
      .success(function(data) {
        $scope.response = data;
        if (data.success === true) {
          $uibModalInstance.close(data);
        }
      })
      .error(function(data) {
        $scope.response = data;
      });
  };

  $scope.close = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.closeResponse = function() {
    $scope.response = null;
  };

}]);

