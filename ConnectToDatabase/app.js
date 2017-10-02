const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Joi = require('joi');
const mssql = require('mssql');

//Database Configuration
var dbconfig = {

    server: "localhost\\MSSQLSERVER1",
    database: "NORTHWND",
    user: "sa",
    password: "123456",
    port: 1433
};
//mohammad
//=====================================================================/
/*Get The List Of All Suppliers*/
function getSuppliers() {

    //Establish The Connection To The Database
    var conn = new mssql.ConnectionPool(dbconfig);
    var result = [];
    var requst = new mssql.Request(conn);
    conn.connect(function (err) {
        if (err) {
            console.log(err);
            return;
        }
        //Send The Query To The Database
        requst.query("SELECT * FROM Suppliers", function (err, records) {
            if (err) {
                console.log(err);
                return;
            }
            else {
                for (var id in records.recordset) {
                    result.push({
                        SupplierID: records.recordset[id].SupplierID,
                        CompanyName: records.recordset[id].CompanyName,
                        ContactName: records.recordset[id].ContactName,
                        Address: records.recordset[id].Address,
                        City: records.recordset[id].City,
                        PostalCode: records.recordset[id].PostalCode,
                        Country: records.recordset[id].Country,
                        url: server.info.uri + '/Suppliers/' + id
                    });

                }
            }
            conn.close();
        });
    });
    return result;
}

//===========================================================================

//===========================================================================
//Get The Last SupplierID From The Database
function getLastRecordData() {

    var conn = new mssql.ConnectionPool(dbconfig);
    var result = [];
    var requst = new mssql.Request(conn);
    conn.connect(function (err) {
        if (err) {
            console.log(err);
            return;
        }
        requst.query("SELECT TOP 1 * FROM Suppliers ORDER BY SupplierID DESC", function (err, records) {
            if (err) {
                console.log(err);
                return;
            }
            else {
                for (var id in records.recordset) {
                    result.push({
                        SupplierID: records.recordset[id].SupplierID,
                    });

                }
            }
            conn.close();
        });
    });
    return result;
}
//================================================================================
//Some Restrections About The Data Types and The IDs
var Suppliers = getSuppliers();
var nextId = Suppliers.length;
var LastRecord = getLastRecordData();

var SupplierResourceSchema = Joi.object({
    SupplierID: Joi.number().integer(),
    CompanyName: Joi.string(),
    ContactName: Joi.string(),
    Address: Joi.string(),
    City: Joi.string(),
    PostalCode: Joi.string(),
    Country: Joi.string(),
    url: Joi.string()
});
var SupplierIdSchema = Joi.number().integer().min(0)
    .required().description('The Supplier ID');
//==============================================================================


//=============================================================================
//Get The Supplier By ID
var getSupplier = function (id) {
    if (!(id in Suppliers)) { return false; }
    var result = {
        SupplierID: Suppliers[id].SupplierID,
        CompanyName: Suppliers[id].CompanyName,
        ContactName: Suppliers[id].ContactName,
        Address: Suppliers[id].Address,
        City: Suppliers[id].City,
        PostalCode: Suppliers[id].PostalCode,
        Country: Suppliers[id].Country,
        url: server.info.uri + '/Suppliers/' + id
    }
    return result;
};
//=============================================================================

//============================================================================
// Create The Server Using Habi 
const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 7000,
    routes: { cors: true }
});

const swaggerOptions = {
    info: {
        'title': 'Supplier API',
        'version': '1.0',
        'description': 'A simple TODO API',
    },
    documentationPath: '/doc',
    tags: [
        {
            description: 'TODO operations',
            name: 'Suppliers'
        }
    ]
}

server.register([
    Inert,
    Vision,
    {
        register: HapiSwagger,
        options: swaggerOptions
    }
]);


//===========================================================================================


//===========================================================================================
//Get The List Of All The Suppliers
server.route({
    method: 'GET',
    path: '/Suppliers/',
    handler: function (request, reply) {
        var result = [];
        for (var key in Suppliers) {
            result.push(getSupplier(key));
        }
        reply(result).code(200);
    },
    config: {
        tags: ['api'],
        description: 'List all Suppliers',
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Success',
                        schema: Joi.array().items(
                            SupplierResourceSchema.label('Result')
                        )
                    }
                }
            }
        }
    }
});
//=====================================================================================

//=====================================================================================
//Delete All The Records From Database
server.route({
    method: 'DELETE',
    path: '/Suppliers/',
    handler: function (request, reply) {

        var conn = new mssql.ConnectionPool(dbconfig);
        var requst = new mssql.Request(conn);
        conn.connect(function (err) {

            if (err) {
                console.log(err);
                return;
            }
            requst.query("delete FROM Suppliers", function (err, records) {
                if (err) {
                    console.log(err);
                    return;
                }
                else {
                    reply('ALL THE RECORDS HAS BEEN DELETED');
                }
                conn.close();
            });
        });
    },
    config: {
        tags: ['api'],
        description: 'Delete all Suppliers',
        plugins: {
            'hapi-swagger': {
                responses: {
                    204: { description: 'Suppliers deleted' }
                }
            }
        }
    }
});
//================================================================================


//===============================================================================
//Add New Record To The Database
server.route({
    method: 'POST',
    path: '/Suppliers/',
    handler: function (request, reply) {
        var data = getLastRecordData();
        var conn = new mssql.ConnectionPool(dbconfig);
        var requst = new mssql.Request(conn);
        conn.connect(function (err) {
            if (err) {
                console.log(err);
                return "ERROR";
            }
            requst.query("insert into Suppliers values('" + request.payload.CompanyName + "','" +
                request.payload.ContactName + "','" + request.payload.Address + "','" + request.payload.City + "','"
                + request.payload.PostalCode + "','"
                + request.payload.Country + "')", function (err, records) {
                    Suppliers.push({
                        SupplierID: request.payload.SupplierID,
                        CompanyName: request.payload.CompanyName,
                        ContactName: request.payload.ContactName,
                        Address: request.payload.Address,
                        City: request.payload.City,
                        PostalCode: request.payload.PostalCode,
                        Country: request.payload.Country,
                    });
                    var next = Suppliers.length;
                    if (err) {
                        console.log(err);
                        return "CONNECTION ERROR";
                    }
                    else {
                        console.log("Inserted Successfully");
                        reply(getSupplier(next - 1)).code(201);
                    }
                    conn.close();
                });
        });

    },
    config: {
        tags: ['api'],
        description: 'Create a Supplier',
        validate: {
            payload: {
                SupplierID: Joi.number().integer(),
                CompanyName: Joi.string(),
                ContactName: Joi.string(),
                Address: Joi.string(),
                City: Joi.string(),
                PostalCode: Joi.string(),
                Country: Joi.string()
            }
        },
        plugins: {
            'hapi-swagger': {
                responses: {
                    201: {
                        description: 'Created',
                        schema: SupplierResourceSchema.label('Result')
                    }
                }
            }
        }
    }
});
//=====================================================================
//Get A Supplier By ID
server.route({
    method: 'GET',
    path: '/Suppliers/{Supplier_id}',
    handler: function (request, reply) {
        response = getSupplier(request.params.Supplier_id);
        if (response === false) {
            reply().code(404);
        } else {
            reply(response).code(200);
        }
    },
    config: {
        tags: ['api'],
        description: 'Fetch a given Supplier',
        validate: {
            params: {
                Supplier_id: SupplierIdSchema
            }
        },
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Success',
                        schema: SupplierResourceSchema.label('Result')
                    },
                    404: { description: 'Supplier not found' }
                }
            }
        }
    }
});
//=================================================================================

//================================================================================
// Update Certain Values From Supplier Objects
server.route({
    method: 'PATCH',
    path: '/Suppliers/{Supplier_id}',
    handler: function (request, reply) {
        SupplierId = request.params.Supplier_id;
        var GetRecords = getSupplier(SupplierId);
        var SupplierIdFromParameter = GetRecords.SupplierID;
        var counter = 0;
        for (var i = 0; i < Suppliers.length; i++) {
            if (SupplierIdFromParameter == Suppliers[i].SupplierID) {
                counter++;
            }
        }
        if (counter > 0) {
            var conn = new mssql.ConnectionPool(dbconfig);
            var requst = new mssql.Request(conn);
            conn.connect(function (err) {

                if (err) {
                    console.log(err);
                    return;
                }
                for (var attrName in request.payload) {
                    Suppliers[SupplierId][attrName] = request.payload[attrName];
                    var Query = "Update Suppliers set " + attrName + " = '" + request.payload[attrName] + "' where SupplierID = '" + SupplierIdFromParameter + "'";
                    requst.query(Query, function (err, records) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        else {
                            reply('The Records Has Been Updated');
                        }
                        conn.close();
                    });
                }
                reply(getSupplier(SupplierId)).code(200);
            });

        }

        else {
            reply().code(404);
        }
    },
    config: {
        tags: ['api'],
        description: 'Update a given Supplier',
        validate: {
            params: {
                Supplier_id: SupplierIdSchema
            },
            payload: {
                SupplierID: Joi.number().integer(),
                CompanyName: Joi.string(),
                ContactName: Joi.string(),
                Address: Joi.string(),
                City: Joi.string(),
                PostalCode: Joi.string(),
                Country: Joi.string()
            }
        },
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Success',
                        schema: SupplierResourceSchema.label('Result')
                    },
                    404: { description: 'Supplier not found' }
                }
            }
        }
    }
});
//============================================================================

//============================================================================
//Delete A Record By Its ID
server.route({
    method: 'DELETE',
    path: '/Suppliers/{Supplier_id}',
    handler: function (request, reply) {
        var conn = new mssql.ConnectionPool(dbconfig);
        var requst = new mssql.Request(conn);
        SupplierId = request.params.Supplier_id;
        var GetRecords = getSupplier(SupplierId);
        var SupplierIDFromParameter = GetRecords.SupplierID;
        var counter = 0;
        conn.connect(function (err) {

            if (err) {
                console.log(err);
                return;
            }
            for (var i = 0; i < Suppliers.length; i++) {
                if (SupplierIDFromParameter == Suppliers[i].SupplierID) {
                    counter++;
                }
            }

            if (counter > 0) {
                for (var j in Suppliers) {
                    Suppliers = Suppliers.filter(function () {
                        return Suppliers[j].SupplierID !== SupplierIDFromParameter;
                    });
                }
                requst.query("delete FROM Suppliers where SupplierID = '" + SupplierIDFromParameter + "'", function (err, records) {

                    if (err) {
                        console.log(err);
                        return;
                    }
                    else {
                        reply('The Record Has Been Deleted').code(200);
                    }
                    Suppliers = getSuppliers();
                    conn.close();
                });
            }
            else {
                reply('Supplier Not Found').code(404);
                return;
            }
        });
    },
    config: {
        tags: ['api'],
        description: 'Delete a given Supplier',
        validate: {
            params: {
                Supplier_id: SupplierIdSchema
            }
        },
        plugins: {
            'hapi-swagger': {
                responses: {
                    204: { description: 'Supplier deleted' },
                    404: { description: 'Supplier not found' }
                }
            }
        }
    }
});
//=======================================================================

//Start The Server
server.start((err) => {
    console.log('Server running at:', server.info.uri);
});

//======================================================================
