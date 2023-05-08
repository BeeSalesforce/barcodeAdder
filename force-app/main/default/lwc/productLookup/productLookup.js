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

	get showNewProduct() {
		return this.newProduct;
	}

	connectedCallback() {
		this.scanner = getBarcodeScanner();
		this.scanButtonDisabled =
			this.scanner === null || !this.scanner.isAvailable() || this.missingFlowName || this.missingApexClass;
	}

	renderedCallback() {
		
	}

    handleSearch(event){
        this.handleBeginScanClick(event);
    }

	handleSubmit(event){
		this.submitDisabled = true;
	}

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

	handleBeginScanClick(event) {
		this.scannedBarcode = '';
		this.scanComplete = false;
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