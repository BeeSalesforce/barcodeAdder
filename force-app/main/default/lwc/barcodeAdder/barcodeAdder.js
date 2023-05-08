import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';
import { updateRecord } from 'lightning/uiRecordApi';
import BARCODE_FIELD from '@salesforce/schema/Product2.StockKeepingUnit';
import ID_FIELD from '@salesforce/schema/Product2.Id';

export default class barcodeAdder extends LightningElement {
    myScanner;
    scanButtonDisabled = false;
    scannedBarcode = '';
    @api recordId;

    
    // When component is initialized, detect whether to enable Scan button
    connectedCallback() {
        this.myScanner = getBarcodeScanner();
        if (this.myScanner == null || !this.myScanner.isAvailable()) {
            this.scanButtonDisabled = true;
        }
    }

    handleBeginScanClick(event) {
        // Reset scannedBarcode to empty string before starting new scan
        this.scannedBarcode = '';

        // Make sure BarcodeScanner is available before trying to use it
        // Note: We _also_ disable the Scan button if there's no BarcodeScanner
        if (this.myScanner != null && this.myScanner.isAvailable()) {
            const scanningOptions = {
                barcodeTypes: [this.myScanner.barcodeTypes.QR,
                                this.myScanner.barcodeTypes.CODE_128,
                                this.myScanner.barcodeTypes.CODE_39,
                                this.myScanner.barcodeTypes.CODE_93,
                                this.myScanner.barcodeTypes.DATA_MATRIX,
                                this.myScanner.barcodeTypes.EAN_13,
                                this.myScanner.barcodeTypes.EAN_8,
                                this.myScanner.barcodeTypes.ITF,
                                this.myScanner.barcodeTypes.PDF_417,
                                this.myScanner.barcodeTypes.UPC_A,
                                this.myScanner.barcodeTypes.UPC_E,
                            ],
                instructionText: 'Scan a Barcode',
                successText: 'Scanning complete.'
            };
            this.myScanner
                .beginCapture(scanningOptions)
                .then((result) => {
                    console.log(result);

                    // Do something with the barcode scan value:
                    // - look up a record
                    // - create or update a record
                    // - parse data and put values into a form
                    // - and so on; this is YOUR code
                    // Here, we just display the scanned value in the UI

                    const fields = {};
                    fields[ID_FIELD.fieldApiName] = this.recordId;
                    fields[BARCODE_FIELD.fieldApiName] = result.value;
                    const recordInput = { fields };
                    updateRecord(recordInput);

                    this.scannedBarcode = result.value;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Successful Scan',
                            message: 'Barcode added successfully.',
                            variant: 'success'
                        })
                    );
                })
                .catch((error) => {
                    // Handle cancellation and unexpected errors here
                    console.error(error);

                    if (error.code == 'userDismissedScanner') {
                        // User clicked Cancel
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Scanning Cancelled',
                                message:
                                    'You cancelled the scanning session.',
                                mode: 'sticky'
                            })
                        );
                    }
                    else { 
                        // Inform the user we ran into something unexpected
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Barcode Scanner Error',
                                message:
                                    'There was a problem scanning the barcode: ' +
                                    error.message,
                                variant: 'error',
                                mode: 'sticky'
                            })
                        );
                    }
                })
                .finally(() => {
                    console.log('#finally');

                    // Clean up by ending capture,
                    // whether we completed successfully or had an error
                    this.myScanner.endCapture();
                });
        } else {
            // BarcodeScanner is not available
            // Not running on hardware with a camera, or some other context issue
            console.log(
                'Scan Barcode button should be disabled and unclickable.'
            );
            console.log('Somehow it got clicked: ');
            console.log(event);

            // Let user know they need to use a mobile phone with a camera
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Barcode Scanner Is Not Available',
                    message:
                        'Try again from the Salesforce app on a mobile device.',
                    variant: 'error'
                })
            );
        }
    }
}