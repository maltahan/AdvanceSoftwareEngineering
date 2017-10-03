const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Joi = require('joi');
const mssql = require('mssql');

//Database Configuration
var dbconfig = {

    server: "localhost\\MSSQLSERVER1",
    database: "ASE",
    user: "sa",
    password: "123456",
    port: 1433
};
//=====================================================================/
/*Get The List Of All Tags*/
function GetTags() {

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
        requst.query("SELECT * FROM Tag", function (err, records) {
            if (err) {
                console.log(err);
                return;
            }
            else {
                for (var id in records.recordset) {
                    result.push({
                        Tag_Id: records.recordset[id].Tag_Id,
                        Tag_Name: records.recordset[id].Tag_Name,
                        url: server.info.uri + '/tags/' + id
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
        requst.query("SELECT TOP 1 * FROM Tag ORDER BY Tag_Id DESC", function (err, records) {
            if (err) {
                console.log(err);
                return;
            }
            else {
                for (var id in records.recordset) {
                    result.push({
                        Tag_Id: records.recordset[id].Tag_Id,
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
var Tags = GetTags();
var nextId = Tags.length;
//var LastRecord = getLastRecordData();

var TagResourceSchema = Joi.object({
    Tag_Id: Joi.number().integer(),
    Tag_Name: Joi.string(),
    url: Joi.string()
});
var TagIdSchema = Joi.number().integer().min(0)
    .required().description('The Tag ID');
//==============================================================================


//=============================================================================
//Get The Supplier By ID
var getTag = function (id) {
    if (!(id in Tags)) { return false; }
    var result = {
        Tag_Id: Tags[id].Tag_Id,
        Tag_Name: Tags[id].Tag_Name,
        url: server.info.uri + '/tags/' + id
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
        'title': 'Tag API',
        'version': '1.0',
        'description': 'A simple TODO API',
    },
    documentationPath: '/doc',
    tags: [
        {
            description: 'TODO operations',
            name: 'Tags'
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
//Get The List Of All The Tags
server.route({
    method: 'GET',
    path: '/tags/',
    handler: function (request, reply) {
        var result = [];
        for (var key in Tags) {
            result.push(getTag(key));
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
                            TagResourceSchema.label('Result')
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
    path: '/tags/',
    handler: function (request, reply) {

        var conn = new mssql.ConnectionPool(dbconfig);
        var requst = new mssql.Request(conn);
        var requst1 = new mssql.Request(conn);
        conn.connect(function (err) {

            if (err) {
                console.log(err);
                return;
            }

            requst.query("delete FROM Todo_Tag", function (err, records) {
                if (err) {
                    console.log(err);
                    return;
                }              
            });


            requst.query("delete FROM Tag", function (err, records) {
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
        description: 'Delete all Tags',
        plugins: {
            'hapi-swagger': {
                responses: {
                    204: { description: 'Tags deleted' }
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
    path: '/tags/',
    handler: function (request, reply) {
        var data = getLastRecordData();
        var conn = new mssql.ConnectionPool(dbconfig);
        var requst = new mssql.Request(conn);
        conn.connect(function (err) {
            if (err) {
                console.log(err);
                return "ERROR";
            }
            requst.query("insert into Tag values('" + request.payload.Tag_Name + "')", function (err, records) {
                Tags.push({
                    Tag_Id: request.payload.Tag_Id,
                    Tag_Name: request.payload.Tag_Name,
                    });
                    var next = Tags.length;
                    if (err) {
                        console.log(err);
                        return "CONNECTION ERROR";
                    }
                    else {
                        console.log("Inserted Successfully");
                        reply(getTag(next - 1)).code(201);
                    }
                    conn.close();
                });
        });

    },
    config: {
        tags: ['api'],
        description: 'Create a Tag',
        validate: {
            payload: {
                Tag_Id: Joi.number().integer(),
                Tag_Name: Joi.string(),
            }
        },
        plugins: {
            'hapi-swagger': {
                responses: {
                    201: {
                        description: 'Created',
                        schema: TagResourceSchema.label('Result')
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
    path: '/tags/{tag_id}',
    handler: function (request, reply) {
        response = getTag(request.params.tag_id);
        if (response === false) {
            reply().code(404);
        } else {
            reply(response).code(200);
        }
    },
    config: {
        tags: ['api'],
        description: 'Fetch a given Tag',
        validate: {
            params: {
                tag_id: TagIdSchema
            }
        },
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Success',
                        schema: TagResourceSchema.label('Result')
                    },
                    404: { description: 'Tag not found' }
                }
            }
        }
    }
});
//=================================================================================

//================================================================================
// Update Certain Values From Supplier Objects
//server.route({
//    method: 'PATCH',
//    path: '/Tags/{Tag_Id}',
//    handler: function (request, reply) {
//        SupplierId = request.params.Tag_Id;
//        var GetRecords = getTag(SupplierId);
//        var SupplierIdFromParameter = GetRecords.SupplierID;
//        var counter = 0;
//        for (var i = 0; i < Tags.length; i++) {
//            if (SupplierIdFromParameter == Tags[i].SupplierID) {
//                counter++;
//            }
//        }
//        if (counter > 0) {
//            var conn = new mssql.ConnectionPool(dbconfig);
//            var requst = new mssql.Request(conn);
//            conn.connect(function (err) {

//                if (err) {
//                    console.log(err);
//                    return;
//                }
//                for (var attrName in request.payload) {
//                    Tags[SupplierId][attrName] = request.payload[attrName];
//                    var Query = "Update Tags set " + attrName + " = '" + request.payload[attrName] + "' where SupplierID = '" + SupplierIdFromParameter + "'";
//                    requst.query(Query, function (err, records) {
//                        if (err) {
//                            console.log(err);
//                            return;
//                        }
//                        else {
//                            reply('The Records Has Been Updated');
//                        }
//                        conn.close();
//                    });
//                }
//                reply(getTag(SupplierId)).code(200);
//            });

//        }

//        else {
//            reply().code(404);
//        }
//    },
//    config: {
//        tags: ['api'],
//        description: 'Update a given Supplier',
//        validate: {
//            params: {
//                Tag_Id: TagIdSchema
//            },
//            payload: {
//                SupplierID: Joi.number().integer(),
//                CompanyName: Joi.string(),
//                ContactName: Joi.string(),
//                Address: Joi.string(),
//                City: Joi.string(),
//                PostalCode: Joi.string(),
//                Country: Joi.string()
//            }
//        },
//        plugins: {
//            'hapi-swagger': {
//                responses: {
//                    200: {
//                        description: 'Success',
//                        schema: TagResourceSchema.label('Result')
//                    },
//                    404: { description: 'Supplier not found' }
//                }
//            }
//        }
//    }
//});
//============================================================================

//============================================================================
//Delete A Record By Its ID
server.route({
    method: 'DELETE',
    path: '/tags/{Tag_Id}',
    handler: function (request, reply) {
        var conn = new mssql.ConnectionPool(dbconfig);
        var requst = new mssql.Request(conn);
        Tag_ID = request.params.Tag_Id;
        var GetRecords = getTag(Tag_ID);
        var TagIDFromParameter = GetRecords.Tag_Id;
        var counter = 0;
        conn.connect(function (err) {

            if (err) {
                console.log(err);
                return;
            }
            for (var i = 0; i < Tags.length; i++) {
                if (TagIDFromParameter == Tags[i].Tag_Id) {
                    counter++;
                }
            }

            if (counter > 0) {
                for (var j in Tags) {
                    Tags = Tags.filter(function () {
                        return Tags[j].Tag_Id !== TagIDFromParameter;
                    });
                }

                requst.query("delete FROM Todo_Tag where Tag_Id = '" + TagIDFromParameter + "'", function (err, records) {

                    if (err) {
                        console.log(err);
                        return;
                    }                  
                    Tags = GetTags();
                });


                requst.query("delete FROM Tag where Tag_Id = '" + TagIDFromParameter + "'", function (err, records) {

                    if (err) {
                        console.log(err);
                        return;
                    }
                    else {
                        reply('The Record Has Been Deleted').code(200);
                    }
                    Tags = GetTags();
                    conn.close();
                });
            }
            else {
                reply('Tag Not Found').code(404);
                return;
            }
        });
    },
    config: {
        tags: ['api'],
        description: 'Delete a given Supplier',
        validate: {
            params: {
                Tag_Id: TagIdSchema
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
