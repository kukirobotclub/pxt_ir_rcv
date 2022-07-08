#include "pxt.h"
#include <map>
#include <vector>
#include "ReceiverIR.h"
using namespace pxt;

enum class Pins{
  P0=  3,
  P1=  2,
  P2=  1,
  P3=  4,
  P4=  5,
  P5=  17,
  P6=  12,
  P7=  11,
  P8=  18,
  P9=  10,
  P10= 6,
  P11= 26,
  P12= 20,
  P13= 23,
  P14= 22,
  P15= 21,
  P16= 16,
  P19= 0,
  P20= 30
};

//% color=50 weight=19
//% icon="\uf1eb"
namespace Microbit_IR { 
  Timer tsb; 
  uint8_t buf[32];
  uint32_t now;
  ReceiverIR *rx;
  RemoteIR::Format fmt = RemoteIR::UNKNOWN;


  //% weight=78
  //% blockId=ir_getdata block="赤外線データ"
  //% blockHidden=false
  uint32_t Get_IRData(void) {
    if (rx->getState() == ReceiverIR::Received){
      int x = rx->getData(&fmt, buf, 32 * 8);
      return (uint32_t)((buf[3]<<24)|(buf[2]<<16)|(buf[1]<<8)|(buf[0]));
    }else{
      return 0xffffffff;
    }
  }

  //% weight=79
  //% blockId=ir_is_received block="赤外線受信あり?"
  //% blockHidden=false
  boolean is_IRreceived(void){
    if (rx->getState() == ReceiverIR::Received) return true;
    return false;
  }

//  void monitorIR(){
//    while(1){
//      while(rx->getState() != ReceiverIR::Received){ 
//        uBit.sleep(50);
//      }
//      onReceivable();
//    }
//  }

  /**
  * initialises local variablesssss
  */
  //% blockId=ir_init
  //% block="赤外線受信器を %pin に接続する"
  void init(Pins pin){
    rx = new ReceiverIR((PinName)pin);
    tsb.start(); //interrupt timer for debounce
    //create_fiber(monitorIR);
  }
}
