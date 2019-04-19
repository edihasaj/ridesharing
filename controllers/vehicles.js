const BaseController = require('./basecontroller');
const swagger = require('swagger-node-restify');

class Vehicles {
  constructor(lib) {
    super();
    this.lib = lib;
  }

  list(req, res, next) {
    let criteria = {}

    if (req.params.q) {
      let expr = new RegExp('.*' + req.params.q + '.*')
      criteria.$or = [{vehicle_id: expr},
        {brand_name: expr},
        {model_name: expr},
        {model_year: expr},
        {car_color: expr}
      ]
    }
    if (req.params.service_class_name) {
      criteria.service_class_name = req.params.service_class_name
    }

    this.lib.db.model('Vehicle')
      .find(criteria)
      .populate('vehicles')
      .exec((err, vehicles) => {
        if (err) return next(err)
        this.writeHAL(res, vehicles)
      })
  }

  details(req, res, next) {
    let id = req.params.id
    if (id) {
      this.lib.db.model("Vehicle")
        .findOne({
          _id: id
        })
        .populate('vehicles')
        .populate('vehicle_type')
        .populate('service_class')
        .exec((err, vehicle) => {
          if (err) return next(this.RESTError('InternalServerError', err))
          if (!vehicle) {
            return next(this.RESTError('ResourceNotFoundError', 'Vehicle not found'))
          }
          this.writeHAL(res, vehicle)
        })
    } else {
      next(this.RESTError('InvalidArgumentError', 'Missing vehicle id'))
    }
  }

  create(req, res, next) {
    let vehicleData = req.body
    if (vehicleData) {
      let vehicleModel = this.lib.db.model('Vehicle')(vehicleData)
      vehicleModel.save((err, vehicle) => {
        if (err) return next(this.RESTError('InternalServerError', err))
        this.writeHAL(res, vehicle)
      })
    } else {
      next(this.RESTError('InvalidArgumentError', 'Missing content of vehicle'))
    }
  }

  vehicleType(req, res, next) {
    let id = req.params.id
    if (id) {
      this.lib.db.model("Vehicle")
        .findOne({
          _id: id
        })
        .populate('vehicle_type')
        .exec((err, vehicle) => {
          if (err) return next(this.RESTError('InternalServerError', err))
          if (!vehicle) {
            return next(this.RESTError('ResourceNotFoundError', 'Vehicle not found'))
          }
          this.writeHAL(res, vehicle.vehicle_type)
        })
    } else {
      next(this.RESTError('InvalidArgumentError', 'Missing vehicle id'))
    }
  }

  serviceClass(req, res, next) {
    let id = req.params.id
    if (id) {
      this.lib.db.model("Vehicle")
        .findOne({
          _id: id
        })
        .populate('service_class')
        .exec((err, vehicle) => {
          if (err) return next(this.RESTError('InternalServerError', err))
          if (!vehicle) {
            return next(this.RESTError('ResourceNotFoundError', 'Vehicle not found'))
          }
          this.writeHAL(res, vehicle.service_class)
        })
    } else {
      next(this.RESTError('InvalidArgumentError', 'Missing vehicle id'))
    }
  }

  update(req, res, next) {
    let data = req.body
    let id = req.params.id
    if (id) {
      this.lib.db.model("Vehicle")
        .findOne({
          _id: id
        })
        .exec((err, vehicle) => {
          if (err) return next(this.RESTError('InternalServerError', err))
          if (!vehicle) return next(this.RESTError('ResourceNotFoundError', 'Vehicle not found'))
          vehicle = Object.assign(vehicle, data)
          vehicle.save((err, data) => {
            if (err) return next(this.RESTError('InternalServerError', err))
            this.writeHAL(res, data.toJSON())
          })
        })
    } else {
      next(this.RESTError('InvalidArgumentError', 'Invalid id received'))
    }
  }
}

  module.exports = function(lib) {
    let controller = new Vehicles(lib);

    controller.addAction({
      'path': '/vehicles',
      'method': 'GET',
      'summary': 'Returns the list of vehicles',
      "params": [swagger.queryParam('q', 'Search term', 'string'),
        swagger.queryParam('service_class_name', 'Filter by service name', 'string')
      ],
      'responseClass': 'Vehicle',
      'nickname': 'getVehicles'
    }, controller.list)

    controller.addAction({
      'path': '/vehicles/{id}',
      'method': 'GET',
      'params': [swagger.pathParam('id', 'The Id of the vehicle', 'int')],
      'summary': 'Returns the full data of a vehicle',
      'responseClass': 'getVehicle'
    }, controller.details)

    controller.addAction({
      'path': '/vehicles',
      'method': 'POST',
      'params': [swagger.bodyParam('book', 'JSON representation of th new vehicle', 'string')],
      'summary': 'Adds a new vehicle into the collection',
      'responseClass': 'Vehicle',
      'nickname': 'newVehicle'
    }, controller.create)

    controller.addAction({
      'path': '/vehicles/{id}/vehicle_type',
      'method': 'GET',
      'params': [swagger.pathParam('id', 'The Id of the vehicle', 'int')],
      'summary': 'Returns the list of vehicle type of one specific vehicle',
      'responseClass': 'VehicleType',
      'nickname': 'getVehicleType'
    }, controller.vehicleType)

    controller.addAction({
      'path': '/vehicles/{id}/serviceClass',
      'method': 'GET',
      'params': [swagger.pathParam('id', 'The Id of the vehicle', 'int')],
      'summary': 'Returns the list of vehicle service of one specific vehicle',
      'responseClass': 'ServiceClass',
      'nickname': 'getServiceClass'
    }, controller.serviceClass)

    controller.addAction({
      'path': '/vehicles/{id}',
      'method': 'PUT',
      'params': [swagger.pathParam('id', 'The Id of the vehicle to update', 'string')],
      'summary': 'Updates the information of one specific vehicle',
      'responseClass': 'Vehicle',
      'nickname': 'updateVehicle'
    }, controller.update)

    return controller;
  };
