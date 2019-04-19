const BaseController = require('./basecontroller');
const swagger = require('swagger-node-restify');

class Drivers extends BaseController {
  constructor(lib) {
    super();
    this.lib = lib;
  }

  list(req, res, next) {
    let criteria = {}
    if(req.params.username) {
      criteria.username = new RegExp(req.params.username, 'i')
    }
    this.lib.db.model('Driver')
      .find(criteria)
      .exec((err, list) => {
        if(err) return next(this.RESTError('InternalServerError', err))
        this.writeHAL(res, list)
      })
  }

  details(req, res, next) {
    let id = req.params.id
    if(id) {
      this.lib.db.model('Driver')
        .findOne({_id: id})
        .populate('drivers')
        .exec((err, data) => {
          if(err) return next(this.RESTError('InternalServerError', err))
          if(!data) return next(this.RESTError('ResourceNotFoundError', 'Driver not found'))

          this.writeHAL(res, data)
        })
    } else {
      next(this.RESTError('InvalidArgumentError', 'Invalid id'))
    }
  }

  storeDriver(req, res, next) {
    let id = req.params.id
    if(id) {
      let criteria = {
        drivers: {$elemMatch: {"driver": id}}
      }
      if(req.params.q) {
        let expr = new RegExp('.*' + req.params.q + '.*', 'i')
        criteria.$or = [
          {vehicle_id: expr},
          {first_name: expr},
          {last_name: expr},
          {email: expr},
          {phone_no: expr},
          {password: expr},
          {gender: expr},
          {dob: expr},
          {is_verified: expr},
          {is_online: expr},
          {profile_pic: expr},
          {rating: expr},
          {is_vehicle_document_uploaded: expr},
        ]
      }

      this.lib.db.model('Driver')
        .find(criteria)
        .populate('drivers')
        .exec((err, data) => {
          if(err) return next(this.RESTError('InternalServerError', err))
          this.writeHAL(res, data)
        })
    } else {
      next(this.RESTError('InvalidArgumentError', 'Invalid id'))
    }
  }

  storeVehicleDocument(req, res, next) {
    let id = req.params.id
    if(id) {
      this.lib.db.model('Vehicle')
        .findOne({_id: id})
        .populate('driver_vehicle_document')
        .populate('drivers')
        .exec((err, data) => {
          if(err) return next(this.RESTError('InternalServerError', err))
          if(!data) {
            return next(this.RESTError('ResourceNotFoundError', 'Driver not found'))
          }
          console.log(data)
          this.writeHAL(res, data.driver_vehicle_document)
        })
    } else {
      next(this.RESTError('InvalidArgumentError', 'Invalid id'))
    }
  }

  storeDriverPayment(req, res, next) {
    let id = req.params.id
    if(id) {
      this.lib.db.model('Driver')
        .find({driver: id})
        .populate('driver_payments')
        .exec((err, data) => {
          if(err) return next(this.RESTError('InternalServerError', err))
          this.writeHAL(res, data)
        })
    } else {
      next(this.RESTError('InvalidArgumentError', 'Invalid id'))
    }
  }

  create(req, res, next) {
    let data = req.body
    if(data) {
      let newDriver = this.lib.db.model('Driver')(data)
      newDriver.save((err, driverData) => {
        if(err) return next(this.RESTError('InternalServerError', err))
        this.writeHAL(res, driverData)
      })
    } else {
      next(this.RESTError('InvalidArgumentError', 'No data received'))
    }
  }

  update(req, res, next) {
    let data = req.body
    let id = req.params.id
    if(id) {
      this.lib.db.model('Driver')
        .findOne({_id: id})
        .exec((err, driverData) => {
          if(err) return next(this.RESTError('ResourceNotFoundError', 'Driver not found'))
          driverData = Object.assign(driverData, data)
          driverData.save((err, data) => {
            if(err) return next(this.RESTError('InternalServerError', err))
            this.writeHAL(res, data);
          })
        })
    } else {
      next(this.RESTError('InvalidArgumentError', 'Invalid id received'))
    }
  }
}

  module.exports = lib => {
    let controller = new Drivers(lib);

    controller.addAction({
      'path': '/drivers',
      'method': 'GET',
      'summary': 'Returns the list of drivers',
      'params': [swagger.queryParam('username', 'Filter the list of drivers by username', 'string')],
      'responseClass': 'Drivers',
      'nickname': 'getDrivers'
    }, controller.list);

    controller.addAction({
      'path': '/drivers/{id}',
      'method': 'GET',
      'params': [swagger.pathParam('id', 'The id of the driver', 'string')],
      'summary': 'Returns the data of a driver',
      'responseClass': 'Drivers',
      'nickname': 'getDriver'
    }, controller.details)

    controller.addAction({
      'path': '/drivers/{id}/vehicledocument',
      'method': 'GET',
      'params': [swagger.pathParam('id', 'The id of the driver', 'string')],
      'summary': 'Returns the list of vehicle documents for a driver',
      'responseClass': 'VehicleDocument',
      'nickname': 'getVehicleDocuments'
    }, controller.storeVehicleDocument)

    controller.addAction({
      'path': '/drivers',
      'method': 'POST',
      'summary': 'Adds a new driver to the list',
      'params': [swagger.bodyParam('data', 'The JSON data of the store', 'string')],
      'responseClass': 'Drivers',
      'nickname': 'newDriver'
    }, controller.create)

    controller.addAction({
      'path': '/drivers/{id}',
      'method': 'PUT',
      'summary': "UPDATES a driver's information",
      'params': [swagger.pathParam('id', 'The id of the driver', 'string'), swagger.bodyParam('driverData', 'The new information to update', 'string')],
      'responseClass': 'Drivers',
      'nickname': 'updateDriver'
    }, controller.update)

    return controller;
  };
