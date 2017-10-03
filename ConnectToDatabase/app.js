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

function Get_Todo_Tag() {

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
        requst.query("SELECT * FROM Todo_Tag", function (err, records) {
            if (err) {
                console.log(err);
                return;
            }
            else {
                for (var id in records.recordset) {
                    result.push({
                        Tag_Id: records.recordset[id].Tag_Id,
                        Todo_Id: records.recordset[id].Todo_Id
                    });

                }
            }
            conn.close();
        });
    });
    return result;
}
//======================================================================

function GetTodos() {

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
        requst.query("SELECT * FROM Todo", function (err, records) {
            if (err) {
                console.log(err);
                return;
            }
            else {
                for (var id in records.recordset) {
                    result.push({
                        Todo_Id: records.recordset[id].Todo_Id,
                        Todo_Name: records.recordset[id].Todo_Name,
                        Complete: records.recordset[id].Complete,
                        url: server.info.uri + '/tags/todos/' + id
                    });

                }
            }
            conn.close();
        });
    });
    return result;
}

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
var Todos = GetTodos();
var Todos_Tag = Get_Todo_Tag();
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
//Get The Tag By ID
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


//Get The Todo ids By tag ID
var gettodosIDS = function (TagID) {
   
    var result = [];
    for (var id in Todos_Tag) {
        if (Todos_Tag[id].Tag_Id == TagID){
            result.push({
                Todo_Id: Todos_Tag[id].Todo_Id
            }); 
        }
        
    }
    return result;
};

//============================================================================


//Get The Todo ids By tag ID
var getTodosList = function (TodosId) {

    var result = [];
    for (var id in Todos) {
        if (Todos[id].Todo_Id == TodosId) {
            result.push({
                Todo_Id: Todos[id].Todo_Id,
                Todo_Name: Todos[id].Todo_Name,
                Complete: Todos[id].Complete,
                //url: server.info.uri + '/tags/todos/' + id
            });
        }

    }
    return result;
};

//=============================================================================

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
        description: 'List all Tags',
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
//Get A Tag By ID
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
                    204: { description: 'Tag deleted' },
                    404: { description: 'Tag not found' }
                }
            }
        }
    }
});
//=======================================================================


//List all the todos that are assosiated to a certain tag
server.route({
    method: 'GET',
    path: '/tags/todos/{Tag_Id}',
    handler: function (request, reply) {
        var result = [];
        var Tag_ID = request.params.Tag_Id; 
        var GetRecords = getTag(Tag_ID);
        var TagIDFromParameter = GetRecords.Tag_Id;
        var Todo_IDs = gettodosIDS(TagIDFromParameter);
        for (var key in Todo_IDs) {
            result.push(getTodosList(Todo_IDs[key].Todo_Id));
        }
        reply(result).code(200);
        //response = getTag(request.params.tag_id);
        //if (response === false) {
        //    reply().code(404);
        //} else {
        //    reply(response).code(200);
        //}
        //for (var key in Tags) {
        //    result.push(getTag(key));
        //}
        //reply(result).code(200);
    },
    config: {
        tags: ['api'],
        description: 'List all Tags',
        validate: {
            params: {
                Tag_Id: TagIdSchema
            }
        },
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

//============================================================================
 //Update Certain Values From Tag Objects
server.route({
    method: 'PUT',
    path: '/tags/{Tag_Id}',
    handler: function (request, reply) {
        Tag_ID = request.params.Tag_Id;
        var GetRecords = getTag(Tag_ID);
        var TagIdFromParameter = GetRecords.Tag_Id;
        var counter = 0;
        for (var i = 0; i < Tags.length; i++) {
            if (TagIdFromParameter == Tags[i].Tag_Id) {
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

                Tags[Tag_ID]["Tag_Name"] = request.payload.Tag_Name;
                    var Query = "Update Tag set Tag_Name = '" + request.payload.Tag_Name + "' where Tag_Id = '" + TagIdFromParameter + "'";
                    requst.query(Query, function (err, records) {
                        if (err) {
                            console.log(err);
                            return;
                        }                       
                        conn.close();
                    });
                reply(getTag(Tag_ID)).code(200);
            });

        }

        else {
            var conn = new mssql.ConnectionPool(dbconfig);
            var requst = new mssql.Request(conn);
            conn.connect(function (err) {

                if (err) {
                    console.log(err);
                    return;
                }                 

                    var Query = "insert into Tag values('" + request.payload.Tag_Name + "')";
                    Tags.push({
                        Tag_Id:   request.payload.Tag_Id,
                        Tag_Name: request.payload.Tag_Name,
                    });
                
                    requst.query(Query, function (err, records) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        conn.close();
                    });
                reply(getTag(Tag_ID)).code(200);
            });
        }
    },
    config: {
        tags: ['api'],
        description: 'Update a given Tag',
        validate: {
            params: {
                Tag_Id: TagIdSchema
            },
            payload: {
                Tag_Id: Joi.number().integer(),
                Tag_Name: Joi.string()
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

//Start The Server
server.start((err) => {
    console.log('Server running at:', server.info.uri);
});

//======================================================================
