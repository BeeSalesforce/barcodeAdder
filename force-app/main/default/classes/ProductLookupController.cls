public with sharing class ProductLookupController {
    @AuraEnabled
    public static Product2 getProduct(String barcode) {
        system.debug(barcode);
        List<Product2> pList = [SELECT Id, Name FROM Product2 WHERE StockKeepingUnit = :barcode];
        if(pList.size() > 0){
            return pList[0];
        } else {
            if(pList.size() > 0){
                return pList[0];
            } else {
                Product2 p = new product2();
                p.Name = getProductName(barcode);
                return p;
            }
        }
    }

    @AuraEnabled
    public static String getProductName(String barcode) {
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://api.upcitemdb.com/prod/trial/lookup?upc=' + barcode);
        request.setMethod('GET');
        if(!Test.isRunningTest()){
            HttpResponse response = http.send(request);
            // If the request is successful, parse the JSON response.
            if(response.getStatusCode() == 200) {
                // Deserialize the JSON string into collections of primitive data types.
                Map<String, Object> results = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                List<OBject> items = (List<OBject>) results.get('items');
                Map<String, Object> item = (Map<String, Object>)items[0];
                return item.get('title').toString().left(80);
            }
        }
        return null;
        
    }
}