(function() {
  'use strict';
  // app.js
  angular.module('unboxApp', ['auth0', 'angular-storage', 'angular-jwt', 'ui.bootstrap', 'ngRoute', 'yaru22.angular-timeago'])
  .config(function(authProvider, $httpProvider, jwtInterceptorProvider) {
    // We're annotating this function so that the `store` is injected correctly when this file is minified
    jwtInterceptorProvider.tokenGetter = ['store', function(store) {
      // Return the saved token
      return store.get('token');
    }];
    $httpProvider.interceptors.push('jwtInterceptor');
  })
  .config(function (authProvider) {
    authProvider.init(AUTH0_CONFIG);
  })
  .run(function(auth) {
    // This hooks all auth events to check everything as soon as the app starts
    auth.hookEvents();
  })
  .config(function ($routeProvider) {
    $routeProvider.when('/', {
      templateUrl: 'unboxHome.html',
      controller: 'unboxHomeController'
    }).when('/admin', {
      templateUrl: 'unboxAdmin.html',
      controller: 'unboxAdminController'
    });
  })
  .factory('UnboxService', function($q, $http) {
    return {
      getAllProducts: function() {
        var deferred = $q.defer();
        $http.get('/api/admin/products')
            .then(function(response) {
              deferred.resolve(response);
            }, function errorCallback(err) {
              deferred.reject(err);
            });

        return deferred.promise;
      },
      /**
       * Get models for this subdomain and this user's products.
       * @returns {promise}
       */
      syncProductsAndModels: function() {
        var deferred = $q.defer();

        // load models and products in parallel
        $q.all([
          $http.get('/api/models'),
          $http.get('/api/products?latest=true')
        ]).then(function (responses) {
          var models = responses[0].data.models;
          var products = responses[1].data.products

          // set model on each product for convenience
          _.each(products, function (product) {
            product.modelObj = _.find(models, function (model) {
              return model.name === product.model;
            })
          });
            console.log('products:', products);
          deferred.resolve({products: products, models: models});
        }, function errorCallback(err) {
          console.log(err);
          var msg = 'Error loading models and products. ' + err.status;
          deferred.reject(msg)
        });

        return deferred.promise;
      },
      addProduct: function(product, profile) {
        var deferred = $q.defer();
        var req = {
          method: 'POST',
          url: '/api/products',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {product: product, email: profile.email}
        };
        $http(req)
          .success(function(data, status, headers, config) {
            deferred.resolve();
          })
          .error(function(data, status, headers, config) {
            deferred.reject({status: status, message: data});
          });
        return deferred.promise;
      }
    }
  })
  .controller('unboxAppLoginController', function(auth, store, $location, $scope) {
    $scope.login = function() {
      auth.signin({authParams: { scope: 'openid email'}}, function(profile, token) {
        // Success callback
        store.set('profile', profile);
        store.set('token', token);
        $location.path('/');

      }, function() {
        // Error callback
        console.log('Error from auth.signin')
      });
    };
    $scope.logout = function() {
      auth.signout();
      store.remove('profile');
      store.remove('token');
    };
    $scope.auth = auth;
  })
  .controller('MenuController', function(auth, $scope, $location) {
    $scope.auth = auth;
    $scope.getClass = function(path) {
      // base URL is a special case
      if (path === '/') {
        return $location.path() === '/' ? 'active' : '';
      }
      if ($location.path().substr(0, path.length) == path) {
        return 'active';
      } else {
        return '';
      }
    }
  })
  .controller('unboxAdminController', function(UnboxService, $scope, $q, auth, $modal, $log) {
    $scope.allProducts = null;
    UnboxService.getAllProducts()
        .then(function(data) {
          $scope.allProducts = {products: data.data.products};
        },
        function(err) {
          $scope.errorMessage = err;
        });
  })
  .controller('unboxHomeController', function(UnboxService, $scope, $q, store, auth, $modal, $log) {
    $scope.auth = auth;
    $scope.errorMessage = '';
    $scope.models = null;
    $scope.products = null;

    $scope.syncProducts = function() {
      UnboxService.syncProductsAndModels()
          .then(function(data) {
            $scope.models = {models: data.models};
            $scope.products = {products: data.products};
          },
          function(err) {
            if (err.indexOf('jwt expired') > -1) {

            } else {
              $scope.errorMessage = err;
            }
          });
    };
    $scope.syncProducts();
    $scope.showData = function(device) {
      $('#dataModal').modal('show');
    };

    // things for handling registering a new device
    $scope.addProduct = function() {
      var modalInstance = $modal.open({
        templateUrl: 'addProductModal.html',
        controller: 'AddProductModalInstanceCtrl',
        //size: size,
        resolve: {
          models: function() { return $scope.models; },
          products: function() { return $scope.products; }
        }
      });

      modalInstance.result.then(function (result) {
        var product = {
          sn: result.serialNumberToAdd,
          vendor: result.selectedModel.vendor,
          model: result.selectedModel.name,
          type: 'vendor'
        };
        var profile = store.get('profile');
        UnboxService.addProduct(product, profile)
            .then(function() {
              $scope.syncProducts();
            },
            function(err) {
              var msg = 'Error creating product (HTTP ' + err.status + ') ' + err.message;
              $scope.error = msg;
              console.log(msg)
            });
      }, function () {
        $log.info('Modal dismissed at: ' + new Date());
      });
    };
  })
  .controller('AddProductModalInstanceCtrl', function ($scope, $modalInstance, models, products) {
    $scope.models = models;
    $scope.products = products;

    $scope.selectedModel = null;
    $scope.serialNumberToAdd = '';

    $scope.selectModel = function(model) {
      console.log(model);
      $scope.selectedModel = model;
    };

    $scope.ok = function () {
      $modalInstance.close({
        selectedModel: $scope.selectedModel,
        serialNumberToAdd: $scope.serialNumberToAdd
      });
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  })
  .run(function($rootScope, auth, store, jwtHelper, $location) {
    // This events gets triggered on refresh or URL change
    $rootScope.$on('$locationChangeStart', function() {
      if (!auth.isAuthenticated) {
        var token = store.get('token');
        if (token) {
          if (!jwtHelper.isTokenExpired(token)) {
            auth.authenticate(store.get('profile'), token);
          } else {
            // Either show Login page or use the refresh token to get a new idToken
            $location.path('/');
          }
        }
      }
    });
  });
})();
