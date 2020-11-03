var Utilities = function() {

    this.isEmpty = function (s){   
        return ((s == null) || (s.length == 0));
    },

    this.get_newest_id = function ( dbconnect = {}, table_name = ''){

        if ( !this.isEmpty(table_name) ){
            try{
                let query = " SELECT ( max(group_id) + 1 ) as total FROM "+table_name+" WHERE group_id != '' ";
                dbconnect.query( query , function(
                err, rows, fields
                ) {
                    if (err){
                        res.status(500).send(err);
                    }else{
                        res.status(200).send(rows);
                    }
                
                });

            }catch( err ){
                res.status(400).send(err);
            } 
        }
    }, 

    this._convertArray = function ( row_array = [] ){

        let row_meta = {};
        
        if ( row_array.length>0 ){
            
            row_array.forEach(row => {
                meta_key = row.meta_key;
                meta_value = row.meta_value;

                if ( row.group_id  in row_meta){
                    let add_value = { [meta_key]: meta_value };
                    row_meta[row.group_id] = {...row_meta[row.group_id], ...add_value }

                }else{
                    row_meta[row.group_id] = {  group_id : row.group_id, [meta_key]: meta_value }
                }
            });
            
        }
        
      return row_meta;
    }
  
  };
  
  exports.Utilities = Utilities;

  
/*  var products_array = [
{ id: 1, meta_key : 'name', meta_value : 'Product 1'},
{ id: 1, meta_key : 'price', meta_value : '230'},
{ id: 1, meta_key : 'status', meta_value : '1'}
]

console.log(products_array);
let row_meta = [];
products_array.forEach( function (value, key){
    meta_key = value.meta_key;
    meta_value = value.meta_value;
    if ( value.id  in row_meta){
        let add_value = { [meta_key]: meta_value };
        row_meta[value.id] = {...row_meta[value.id], ...add_value }
        
    }else{
            row_meta[value.id] = { [meta_key]: meta_value }
    }
});

console.log(row_meta);
*/