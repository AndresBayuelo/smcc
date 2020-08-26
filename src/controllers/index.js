const cnx = require('../modules/conexion');
const oracledb = require('oracledb');
const credenciales = {username: 'usersmcc', password: 'secreta'};

const view = (req, res, next) => {
  res.render('index', { title: 'SMCC' });
};

const registrarPlantacion = async (req, res, next) => {

  const {id, descripcion, estado} = req.body;

  const sentencia = async function(conexion){
    return await conexion.execute(
        `INSERT INTO plantacion (id, descripcion, estado) 
        VALUES (:id, :dscrip, :std)`,
        [id, descripcion, estado],
        { autoCommit: true }
    );
  };
  const result = {exe: await cnx.run(credenciales, sentencia)};

  console.log(result);
  res.send(result);

};

const registrarSgmOperativo = async (req, res, next) => {

  const {id, fecha, descripcion, estado} = req.body;

  let sentencia = async function(conexion){
    return await conexion.execute(
        `INSERT INTO sgm_operativo (plantacionid, fecha, descripcion) 
        VALUES (:id, TO_DATE(:fecha, 'YYYY-MM-DD'), :dscrip)`,
        [id, fecha, descripcion],
        { autoCommit: true }
    );
  };
  let result = {exe: await cnx.run(credenciales, sentencia)};
  if( !result.exe.errorNum ){
    sentencia = async function(conexion){
      return await conexion.execute(
          `UPDATE plantacion SET estado = :std WHERE plantacion.id = :id`,
          [estado, id],
          { autoCommit: true }
      );
    };
    result = {exe: await cnx.run(credenciales, sentencia)};
  }

  console.log(result);
  res.send(result);

};

const registrarSgmOperacional = async (req, res, next) => {

  const {id, hmd, tempc, tempf, hmdg} = req.body;

  let sentencia = async function(conexion){
    return await conexion.execute(
        `INSERT INTO sgm_operacional (plantacionid, fecha, humedadamb, tempcent, tempfar, humedadsuelo) 
        VALUES (:id, TO_DATE(sysdate), :hmab, :tmpc, :tmpf, :hmg)`,
        [id, hmd, tempc, tempf, hmdg],
        { autoCommit: true,
          bindDefs: {
            hmab: { type: oracledb.NUMBER },
            tmpc: { type: oracledb.NUMBER },
            tmpf: { type: oracledb.NUMBER }
          }
        }
    );
  };
  let result = {exe: await cnx.run(credenciales, sentencia)};

  console.log(result);
  res.send(result);

};

const actualizarIp = async (req, res, next) => {

  const {id, ip} = req.body;

  let sentencia = async function(conexion){
    return await conexion.execute(
        `UPDATE plantacion SET ip = :ip WHERE plantacion.id = :id`,
        [ip, id],
        { autoCommit: true }
    );
  };

  let result = {exe: await cnx.run(credenciales, sentencia)};

  console.log(result);
  res.send(result);

}

const actualizarLoc = async (req, res, next) => {

  const {id, latitud, longitud} = req.body;
  const lat = (parseInt(latitud) / 1000000).toString();
  const long = (parseInt(longitud) / 1000000).toString();
  
  let sentencia = async function(conexion){
    return await conexion.execute(
        `UPDATE plantacion SET latitud = :lt, longitud = :lg WHERE plantacion.id = :id`,
        [lat, long, id],
        { autoCommit: true,
          bindDefs: {
            lt: { type: oracledb.NUMBER },
            lg: { type: oracledb.NUMBER }
          }
        }
    );
  };
  
  let result = {exe: await cnx.run(credenciales, sentencia)};

  console.log(result);
  res.send(result);

}

const obtenerPlantaciones = async (req, res, next) => {
 
  let sentencia = async function(conexion){
    return await conexion.execute(
        `SELECT id, DBMS_LOB.SUBSTR(descripcion,DBMS_LOB.getlength(descripcion),1), estado, ip, latitud, longitud FROM plantacion`
    );
  };
  
  let result = {exe: await cnx.run(credenciales, sentencia)};

  if( !result.exe.errorNum ){
    let plantaciones =  [];
    const _length = result.exe.rows.length;
    for(let i=0; i<_length; i++){

      let plantacion = {};
      plantacion.id = result.exe.rows[i][0];
      plantacion.descripcion = result.exe.rows[i][1];
      plantacion.estado = result.exe.rows[i][2];
      plantacion.ip = result.exe.rows[i][3];
      plantacion.latitud = result.exe.rows[i][4]; 
      plantacion.longitud = result.exe.rows[i][5];
      
      sentencia = async function(conexion){
        return await conexion.execute(
            `SELECT * FROM sgm_operacional WHERE plantacionid = :id AND ROWNUM = 1 ORDER BY id DESC`,
            [plantacion.id]
        );
      };
      let subresult = {exe: await cnx.run(credenciales, sentencia)};

      if( !subresult.exe.errorNum ){
        if(subresult.exe.rows.length){
          plantacion.humedadamb = subresult.exe.rows[0][3];
          plantacion.tempcent = subresult.exe.rows[0][4];
          plantacion.tempfar = subresult.exe.rows[0][5];
          plantacion.humedadsuelo = subresult.exe.rows[0][6];
        }
      }else{
        i = _length;
        result = subresult;
      }

      plantaciones.push(plantacion);
    }
    result.exe.objects = plantaciones;
  }

  console.log(result);
  res.send(result);

}

const obtenerPlantacion = async (req, res, next) => {

  const {id} = req.query;
 
  let sentencia = async function(conexion){
    return await conexion.execute(
        `SELECT id, DBMS_LOB.SUBSTR(descripcion,DBMS_LOB.getlength(descripcion),1), estado, ip, latitud, longitud FROM plantacion WHERE id = :id`,
        [id]
    );
  };
  
  let result = {exe: await cnx.run(credenciales, sentencia)};

  if( !result.exe.errorNum ){
    if(result.exe.rows.length){

      let plantacion = {};
      plantacion.id = result.exe.rows[0][0];
      plantacion.descripcion = result.exe.rows[0][1];
      plantacion.estado = result.exe.rows[0][2];
      plantacion.ip = result.exe.rows[0][3];
      plantacion.latitud = result.exe.rows[0][4]; 
      plantacion.longitud = result.exe.rows[0][5];
      plantacion.sgm_operativo = [];
      
      sentencia = async function(conexion){
        return await conexion.execute(
            `SELECT fecha, DBMS_LOB.SUBSTR(descripcion,DBMS_LOB.getlength(descripcion),1), imagen FROM sgm_operativo WHERE plantacionid = :id ORDER BY fecha, id DESC`,
            [plantacion.id]
        );
      };
      let subresult = {exe: await cnx.run(credenciales, sentencia)};

      if( !subresult.exe.errorNum ){
        for(let i=0; i<subresult.exe.rows.length; i++){
          let sgm = {};
          sgm.fecha = subresult.exe.rows[i][0];
          sgm.descripcion = subresult.exe.rows[i][1];
          sgm.imagen = subresult.exe.rows[i][2];
          plantacion.sgm_operativo.push(sgm);
        }
      }
      result.exe.objects = plantacion;
    }

  }

  console.log(result);
  res.send(result);

}

module.exports = { view, registrarPlantacion, registrarSgmOperativo, registrarSgmOperacional, actualizarIp, actualizarLoc, obtenerPlantaciones, obtenerPlantacion };