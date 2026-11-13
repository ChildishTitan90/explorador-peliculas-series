/* global db */
// Ejecutar con mongosh; Atlas es MongoDB, PostgreSQL se aloja por separado.
// Reejecutable. No borra documentos. Fallará si datos existentes violan los índices.
const socialDb = db.getSiblingDB('cinepollis_social');
const validator = {$jsonSchema:{bsonType:'object',required:['_id','sourceVersion','visible','userId','titleId','updatedAt'],properties:{
 _id:{bsonType:'string'},sourceVersion:{bsonType:'long'},visible:{bsonType:'bool'},
 userId:{bsonType:'string'},titleId:{bsonType:'string'},updatedAt:{bsonType:'date'},
 publishedAt:{bsonType:['date','null']},score:{bsonType:['double','int','long','decimal','null'],minimum:0,maximum:5},
 actor:{bsonType:'object'},title:{bsonType:'object'},review:{bsonType:'string',maxLength:4000},spoiler:{bsonType:'bool'}
}}};
if(!socialDb.getCollectionNames().includes('activity')) socialDb.createCollection('activity',{validator,validationLevel:'strict'});
else socialDb.runCommand({collMod:'activity',validator,validationLevel:'strict'});
socialDb.activity.createIndex({userId:1,titleId:1},{unique:true});
socialDb.activity.createIndex({visible:1,publishedAt:-1,_id:-1});
socialDb.activity.createIndex({userId:1,visible:1,publishedAt:-1,_id:-1});
print('Colección e índices preparados: cinepollis_social.activity');
