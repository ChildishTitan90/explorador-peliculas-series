/* global db, Long */
/* eslint-disable no-unused-vars -- Funciones invocadas desde mongosh o el worker del backend. */
// Cargar después de 001_atlas.js en mongosh. Adaptar esta función al driver del worker.
// row: fila del outbox SQL, version como STRING para no perder precisión bigint.
function applyActivity(row) {
 const payload=row.payload, version=Long.fromString(String(row.version));
 const collection=db.getSiblingDB('cinepollis_social').activity;
 const document={...payload,_id:payload.entryId,sourceVersion:version,updatedAt:new Date(),
  publishedAt:payload.publishedAt?new Date(payload.publishedAt):null};
 // Se procesa en orden por entryId. Versionado evita reactivar notas borradas
 // o sobrescribir una nota reciente si se reintenta un evento antiguo.
 collection.updateOne({_id:document._id},[{$replaceWith:{$cond:[
  {$lt:[{$ifNull:['$sourceVersion',Long.fromInt(-1)]},version]},
  {$literal:document},'$$ROOT'
 ]}}],{upsert:true});
}
// Actividad general (solo notas visibles; las ediciones NO cambian publishedAt):
function recentActivity(followingIds=null){
 const filter={visible:true};if(followingIds!==null)filter.userId={$in:followingIds};
 return db.getSiblingDB('cinepollis_social').activity.find(filter).sort({publishedAt:-1,_id:-1}).limit(20).toArray();
}
