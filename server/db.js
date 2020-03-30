const mysql = require('mysql');
require('./util/promise.series')

module.exports = class DB {

    constructor(config){
        this.pool = mysql.createPool(config);
    }
    
    getConnection(){
        return new Promise((resolve, reject)=>{
            this.pool.getConnection(function(err, connection) {
                if( err ) reject(err)
                else resolve(connection)
            });
        })
    }

    beginTransaction(){
        return new Promise(async (resolve, reject)=>{
            let conn = await this.getConnection()
            conn.beginTransaction(err=>{
                console.log(err);
                
                if( err ) reject(err)
                else resolve(conn)
            })
        })
    }

    query(sql, data, {timeout=30000}={}){
		return new Promise((resolve, reject)=>{

			sql = mysql.format(sql, data)

            // gets connection, queries, then releases connection
			this.pool.query({sql, timeout}, (err, results, fields)=>{
				if( err ){
					console.info(sql);
                    err.lastQuery = sql
					reject(err)
                    return
                }

                if( Array.isArray(results) ){
                    results = DBResults.loadLargeArray(results)
                }

                results.fromQuery = sql

                resolve(results)
			})
		})
	}

    /* 
        performs a series of queries and if any fail, will roll back  
    */
    async transactionalQuery(queries){

        let queryResults = []
        let conn = await this.beginTransaction()

        try{

            /* peform each query, making sure each one succeeds */
            await Promise.series(queries, query=>new Promise((resolve, reject)=>{
                query.push((err, results, fields)=>{
                    if( err ) return reject(err)
                    queryResults.push(results)
                    resolve(results)
                })
                conn.query.apply(conn, query)
            }))

            /* if we got here, no queries failed */
            conn.commit()

            // https://github.com/mysqljs/mysql/issues/1656
            conn.release()

        }catch(err){
            conn.rollback()
            conn.release()
            throw err
        }

        return queryResults
    }

    // alias
    q(){
        return this.query(...arguments)
    }

    format(...args){
		return mysql.format.apply(mysql, args)
	}
    
    escape(...args){
		return mysql.escape.apply(mysql, args)
	}

    escapeId(...args){
		return mysql.escapeId.apply(mysql, args)
	}

    updateOnDuplicate(attrs){
        let updates = []
        for( let key in attrs ){
            key = this.escapeId(key)
            updates.push(`${key} = VALUES(${key})`)
        }
        return `ON DUPLICATE KEY UPDATE ${updates.join(', ')}`
    }

    get NOW(){ return {toSqlString:()=>'NOW()'}; }

}

class DBResults extends Array {
    static get array_chunk_size(){return 10000}
    
    groupBy(key){
        let group = {}
        this.forEach(row=>{
            if( row[key] )
                group[row[key]] =  row
        })
        return group
	}

    get first(){ return this[0] }
    get last(){ return this[this.length-1] }
	
	get values(){
		return this.map(d=>d[Object.keys(d)[0]])
	}
	
	get value(){
		let values = this.map(d=>d[Object.keys(d)[0]])
		return values[0]
	}

    /**
     * Can't handle initializing with > ~42000 arguments. Use this instead of unpacking very large arrays
     * @param {Array} values
     * @returns {DBResults}
     */
	static loadLargeArray( values){
        const results = new this();
        for(let i=0; i < values.length; i+=DBResults.array_chunk_size){
            results.push(...values.slice(i, i+DBResults.array_chunk_size))
        }
        return results;
    }
    
}