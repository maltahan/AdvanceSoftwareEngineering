const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Joi = require('joi');
const mssql = require('mssql');


var dbconfig = {

    server: "localhost\\MSSQLSERVER1",
    database: "NORTHWND",
    user: "sa",
    password: "123456",
    port: 1433
};
//
function  getSuppliers() {

    var conn = new mssql.ConnectionPool(dbconfig);

    var result = [];
    var requst = new mssql.Request(conn);

    conn.connect(function (err) {

        if (err) {
            console.log(err);
            return;
        }
        requst.query("SELECT * FROM Suppliers", function (err, records) {
            if (err) {
                console.log(err);
                return;
            }
            else {
                //console.log(records);
                
                for (var id in records.recordset) {
                    result.push({
                        SupplierID: records.recordset[id].SupplierID,
                        CompanyName: records.recordset[id].CompanyName,
                        ContactName: records.recordset[id].ContactName,
                        Address: records.recordset[id].Address,
                        City: records.recordset[id].City,
                        PostalCode: records.recordset[id].PostalCode,
                        Country: records.recordset[id].Country,
                        url: server.info.uri + '/todos/' + id
                    });
                    
                }
                //console.log(result);

                
            }
            conn.close();
        });
    });
    return result;
}

function getLastrecordData() {
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
                //console.log(records);

                for (var id in records.recordset) {
                    result.push({
                        SupplierID: records.recordset[id].SupplierID,                       
                    });

                }
                //console.log(result);


            }
            conn.close();
        });
    });
    return result;
}


//SupplierID,CompanyName,ContactName,Address,City,Region,PostalCode,Country

//var todos = {
//    1: { title: 'build an API', order: 1, completed: false },
//    2: { title: '?????', order: 2, completed: false },
//    3: { title: 'profit!', order: 3, completed: false }
//};

var todos = getSuppliers();

var nextId = todos.length;
var s = getLastrecordData();
//var todoResourceSchema = Joi.object({
//    title: Joi.string(),
//    completed: Joi.boolean(),
//    order: Joi.number().integer(),
//    url: Joi.string()
//});

var todoResourceSchema = Joi.object({
    SupplierID: Joi.number().integer(),
    CompanyName: Joi.string(),
    ContactName: Joi.string(),
    Address: Joi.string(),
    City: Joi.string(),
    PostalCode: Joi.string(),
    Country: Joi.string(),
    url: Joi.string()
});


var todoIdSchema = Joi.number().integer().min(0)
    .required().description('The Todo ID');

var getTodo = function (id) {
    if (!(id in todos)) { return false; }
    var result = {
        SupplierID: todos[id].SupplierID,
        CompanyName: todos[id].CompanyName,
        ContactName: todos[id].ContactName,
        Address: todos[id].Address,
        City: todos[id].City,
        PostalCode: todos[id].PostalCode,
        Country: todos[id].Country,
        url: server.info.uri + '/todos/' + id
    }
    return result;
};


const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 7000,
    routes: { cors: true }
});

const swaggerOptions = {
    info: {
        'title': 'Todo API',
        'version': '1.0',
        'description': 'A simple TODO API',
    },
    documentationPath: '/doc',
    tags: [
        {
            description: 'TODO operations',
            name: 'todos'
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

server.route({
    method: 'GET',
    path: '/todos/',
    handler: function (request, reply) {
        var result = [];
        for (var key in todos) {
            result.push(getTodo(key));
        }
        reply(result).code(200);
    },
    config: {
        tags: ['api'],
        description: 'List all todos',
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Success',
                        schema: Joi.array().items(
                            todoResourceSchema.label('Result')
                        )
                    }
                }
            }
        }
    }
});

server.route({
    method: 'DELETE',
    path: '/todos/',
    handler: function (request, reply) {
        //todos = {};
        //reply();

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
        description: 'Delete all todos',
        plugins: {
            'hapi-swagger': {
                responses: {
                    204: { description: 'Todos deleted' }
                }
            }
        }
    }
});

server.route({
    method: 'POST',
    path: '/todos/',
    handler: function (request, reply) {
        //todos[nextId] = {
        //    title: request.payload.title,
        //    order: request.payload.order || 0,
        //    completed: request.payload.completed || false
        //}
        //nextId++;
        //reply(getTodo(nextId - 1)).code(201);

        var data = getLastrecordData();
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
                      todos.push({
                          SupplierID: request.payload.SupplierID,
                          CompanyName: request.payload.CompanyName,
                          ContactName: request.payload.ContactName,
                          Address: request.payload.Address,
                          City: request.payload.City,
                          PostalCode: request.payload.PostalCode,
                          Country: request.payload.Country,
                      });
                      var next = todos.length;
                if (err) {
                    console.log(err);
                    return "CONNECTION ERROR";
                }
                else {
                    console.log("Inserted Successfully");
                    reply(getTodo(next - 1)).code(201);
                      }
                conn.close();
            });
        });

    },
    config: {
        tags: ['api'],
        description: 'Create a todo',
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
                        schema: todoResourceSchema.label('Result')
                    }
                }
            }
        }
    }
});

server.route({
    method: 'GET',
    path: '/todos/{todo_id}',
    handler: function (request, reply) {
        response = getTodo(request.params.todo_id);
        if (response === false) {
            reply().code(404);
        } else {
            reply(response).code(200);
        }
    },
    config: {
        tags: ['api'],
        description: 'Fetch a given todo',
        validate: {
            params: {
                todo_id: todoIdSchema
            }
        },
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Success',
                        schema: todoResourceSchema.label('Result')
                    },
                    404: { description: 'Todo not found' }
                }
            }
        }
    }
});

server.route({
    method: 'PATCH',
    path: '/todos/{todo_id}',
    handler: function (request, reply) {
        todoId = request.params.todo_id;
        var GetRecords = getTodo(todoId);
        var s = GetRecords.SupplierID;
        var counter = 0;
        for (var i = 0; i < todos.length; i++) {
            if (s == todos[i].SupplierID) {
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
                    todos[todoId][attrName] = request.payload[attrName];
                    var Query = "Update Suppliers set " + attrName + " = '" + request.payload[attrName] + "' where SupplierID = '" + s+"'";

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
                reply(getTodo(todoId)).code(200);
            });
            
        }

        else {
            reply().code(404);
        }
        //if (!(todoId in todos)) {
            
        //} else {
            
        //}
    },
    config: {
        tags: ['api'],
        description: 'Update a given todo',
        validate: {
            params: {
                todo_id: todoIdSchema
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
                        schema: todoResourceSchema.label('Result')
                    },
                    404: { description: 'Todo not found' }
                }
            }
        }
    }
});

server.route({
    method: 'DELETE',
    path: '/todos/{todo_id}',
    handler: function (request, reply) {
       
        // delete todos[request.params.todo_id];
        var conn = new mssql.ConnectionPool(dbconfig);
        var requst = new mssql.Request(conn);
        todoId = request.params.todo_id;
        var GetRecords = getTodo(todoId);
        var s = GetRecords.SupplierID;
        var counter = 0;
        conn.connect(function (err) {

            if (err) {
                console.log(err);
                return;
            }

            for (var i = 0; i < todos.length ;i++) {
                if (s == todos[i].SupplierID) {                   
                    counter++;                  
                }                                   
                }

            if (counter > 0) {
                for (var j in todos) {
                    todos = todos.filter(function () {
                        return todos[j].SupplierID !== s;
                    });
                }  

                requst.query("delete FROM Suppliers where SupplierID = '" + s + "'", function (err, records) {

                    if (err) {
                        console.log(err);
                        return;
                    }
                    else {
                        reply('The Record Has Been Deleted').code(200);
                    }
                    todos = getSuppliers();
                    conn.close();
                });
            }
            else {
              
                reply('Todo Not Found').code(404);
                return;
                }

           
        });
    },
    config: {
        tags: ['api'],
        description: 'Delete a given todo',
        validate: {
            params: {
                todo_id: todoIdSchema
            }
        },
        plugins: {
            'hapi-swagger': {
                responses: {
                    204: { description: 'Todo deleted' },
                    404: { description: 'Todo not found' }
                }
            }
        }
    }
});

server.start((err) => {
    console.log('Server running at:', server.info.uri);
});
