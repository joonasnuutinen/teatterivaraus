/**
 * Order rows
 * @param rows (Array) Rows to order
 * @param rowOrder (Array) The order of rows by _id
 * @return (Array) Ordered rows
 */
exports.orderRows = function(rows, rowOrder) {
  var orderedRows = [];
  
  if (!rows || rowOrder.length === 0) {
    // No order is specified so return the original rows
    return rows;
  }
  
  rowOrder.forEach(function eachRow(rowId) {
    const i = rows.findIndex(function findById(row) {
      return rowId.equals(row._id);
    });
    
    orderedRows.push(rows[i]);
    
    // We don't need the row anymore so remove it from the original array
    rows.splice(i, 1);
  });
  
  return orderedRows.concat(rows);
};