/**
 * Created by DavidNg on 15/5/2017.
 */
function importOpenExchangeRate(startDate,endDate){
  console.log(startDate.format());
  console.log(endDate.format());
}

if (require.main === module) {
  importOpenExchangeRate();
}

module.exports = importOpenExchangeRate;