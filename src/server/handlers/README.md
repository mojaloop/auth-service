# auth-service/src/server/handlers

API Resource handlers are declared in [/src/interface/swagger.json](../../interface/swagger.json)
and implemented in separate files or modules in this folder.

Here should be only the code related to `HTTP @hapi` server scope. 
Most files will depend on the specific to _auth-service_ data model which is implemented in [/src/model](../../model/README.md) module. Additionaly any additional/business logic should be implemented in [/src/domain](../../domain/)
Please keep the idea of `separation of concern` fresh and live.