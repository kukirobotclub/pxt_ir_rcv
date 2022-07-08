// Auto-generated. Do not edit.



    //% color="#31C7D5" weight=19
    //% icon="\uf1eb"
declare namespace OSOYOO_IR {

    /**
     * button pushed.
     */
    //% blockId=ir_received_left_event
    //% block="on |%btn| button pressed" shim=Microbit_IR::onPressEvent
    function onPressEvent(btn: RemoteButton, body: () => void): void;

  //% blockId=ir_getdata block="赤外線データ" shim=Microbit_IR::Get_IRData
  //% blockHidden=false
  function Get_IRData(void): uint32_t;


  //% blockId=ir_is_received block="赤外線受信あり?" shim=Microbit_IR::is_IRreceived
  //% blockHidden=false
  function is_IRreceived(void): boolean;

    /**
     * initialises local variablesssss
     */
    //% blockId=ir_init
    //% block="connect ir receiver to %pin" shim=Microbit_IR::init
    function init(pin: Pins): void;
}

// Auto-generated. Do not edit. Really.
