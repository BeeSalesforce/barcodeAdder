import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';

import getProduct from '@salesforce/apex/ProductLookupController.getProduct';

export default class productLookup extends NavigationMixin(LightningElement) {
	scanner;
	scannedBarcode = '';
	scanButtonDisabled = false;
	scanComplete = false;
	newProduct = false;
	newProductId = '';
	newProductName = '';
	submitDisabled = false;

	//Returns true if scanned product doesn't exist
	get showNewProduct() {
		return this.newProduct;
	}

	//Fired when a component is added to the DOM
	//Instantiates the scanner and determines if scanner is available on the user's platform
	connectedCallback() {
		this.scanner = getBarcodeScanner();
		this.scanButtonDisabled =
			this.scanner === null || !this.scanner.isAvailable() || this.missingFlowName || this.missingApexClass;
	}

	//Fired when a component is rendered
	renderedCallback() {
		
	}

	//Fired when Scan Barcode button is clicked
	//Redundant in this case as it just passes to handleBeginScanClick
    handleSearch(event){
        this.handleBeginScanClick(event);
    }

	//Disables Save button when submitting
	handleSubmit(event){
		this.submitDisabled = true;
	}

	//Navigates user to newly created product
	handleSuccess(event){
		this[NavigationMixin.Navigate]({
			type: 'standard__recordPage',
			attributes: {
				recordId: event.detail.id,
				objectApiName: 'Product2',
				actionName: 'view'
			}
		});
    }

	//Barcode handler
	handleBeginScanClick(event) {
		this.scannedBarcode = '';
		this.scanComplete = false;

		//Making sure the scanner is indeed present
		if (this.scanner != null && this.scanner.isAvailable()) {
			this.scanner
				.beginCapture({
					barcodeTypes: [
						this.scanner.barcodeTypes.CODE_128,
						this.scanner.barcodeTypes.CODE_39,
						this.scanner.barcodeTypes.CODE_93,
						this.scanner.barcodeTypes.DATA_MATRIX,
						this.scanner.barcodeTypes.EAN_13,
						this.scanner.barcodeTypes.EAN_8,
						this.scanner.barcodeTypes.ITF,
						this.scanner.barcodeTypes.PDF_417,
						this.scanner.barcodeTypes.QR,
						this.scanner.barcodeTypes.UPC_E
					]
				})
				.then((result) => {
					this.scannedBarcode = result.value;
					this.handleBarCode();
				})
				.catch((error) => {
					this.dispatchEvent(
						new ShowToastEvent({
							title: 'Barcode Scan Error',
							message: JSON.stringify(error),
							variant: 'error',
							mode: 'sticky'
						})
					);
				})
				.finally(() => {
					this.scanner.endCapture();
					this.scanComplete = true;
				});
		}
	}

	//Determines if the product exists or not by calling the ProductLookupController class defined earlier
	handleBarCode() {
        getProduct({
            barcode: this.scannedBarcode
        }).then((result) => {
			if(result.Id === undefined){
				this.newProduct = true;
				this.productName = result.Name
			} else {
				this.newProduct = false;
				this[NavigationMixin.Navigate]({
					type: 'standard__recordPage',
					attributes: {
						recordId: result.Id,
						objectApiName: 'Product2',
						actionName: 'view'
					}
				});
			} 
        });
	}
}