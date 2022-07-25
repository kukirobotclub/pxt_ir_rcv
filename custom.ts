/*
 * PXT for KRC Microbit Control Bord
 * IR remocon recive
 * Copyright 2022 Bitcom 
 *                GNU
 *
 * Version 2022-07-17 0.00 初版
 * Version 2022-07-20 1.00 NECリピート対応、デバッグ用全データ、ビット数
 * Version 2022-07-22 1.01 バイトオーダー変更
 * Version 2022-07-25 1.02 void_cnt=0の場所変更、シリアル出力を全部コメント
 */
//% weight=100 color=#bc0f11 icon="\uf09e"
namespace KRC_IR {

    let irType = 0			// NEC,PNASONIC,SONY
    let state = 0		// 受信フェーズ 0:Leader待ち 1:ビット受信中 2:受信完了
    let bits = 0			// 受信ビットカウンタ
    let work_buff: number[] = []
    let last_address_data = 0	// 前回受信したデータ
    let tm_now = 0
    let tm_off = 0
    let tm_dur = 0
    let tm_last = 0
    let void_cnt = 0		// 無操作カウンタ
    let dbg_cnt = 0

    function toHexChar(decimal: number): string {
        return "0123456789ABCDEF".charAt(decimal)
    }

    function byte2hex(decimal: number): string {
        return toHexChar((decimal >> 4) & 15) + toHexChar(decimal & 15)
    }

    function clear_buff(): void {
        for (let i = 0; i <= 7; i++) {
            work_buff[i] = 0
        }
    }

    function make_data(bit_data: number): void {
        if (bits < 64) {
            if (bit_data) {
                work_buff[bits / 8] |= (1 << (bits % 8));
            } else {
                work_buff[bits / 8] &= ~(1 << (bits % 8));
            }
            bits = bits + 1
        }
    }

    function check_pulse(tm_on_off: number, tm_duration: number): void {
        switch (state) {
          case 0:	// Leader
            if (tm_on_off >= 420 && tm_on_off <= 780) {
                irType = 3;	//SONY
                state = 1;
            }
            if (tm_on_off > 1120 && tm_on_off <= 2080) {
                irType = 2;	//Panasonic
                state = 1;
            }
            if (tm_on_off > 1574 && tm_on_off <= 2922 && tm_duration > 7868 && tm_duration <= 14612) {
                // L4T=2248 1574<2922	H16T+L4T=11240	7868<14612
                irType = 1;	//NEC
                state = 4;	//repeat
                void_cnt = 0
            }
            if (tm_on_off >= 3150 && tm_on_off <= 5850) {
                irType = 1;	//NEC
                state = 1;
            }
            break:
          case 1:	// reciving bit
            if (irType === 1) { // NEC
                // NEC  "0" 1120 "1" 2250
                if (tm_on_off < 1125) {            // low bit
                    make_data(0);
                } else if (tm_on_off < 2197) {	     // high bit
                    make_data(1);
                }
                if (bits >= 32) {
                    last_address_data = work_buff[2]+work_buff[3]*256
                    state = 2
                }
            }
            if (irType === 2) { // Panasonic
                // Panasonic "0" 800 "1" 1600
                if (tm_on_off < 800) {            // low bit
                    make_data(0);
                } else if (tm_on_off < 1560) {	     // high bit
                    make_data(1);
                }
                if (bits >= 48) {
                    last_address_data = work_buff[4]+work_buff[5]*256
                    state = 2
                }
            }
            if (irType === 3) { // SONY
                // SONY  "0" 1200 "1" 1800
                if (tm_duration < 1500) {            // low bit
                    make_data(0);
                } else if (tm_duration < 2400) {	     // high bit
                    make_data(1);
                }
                if (bits >= 11) {
                    last_address_data = work_buff[0]+work_buff[1]*256
                    state = 2
                }
            }
            if (tm_on_off > 2700) {
                state = 3;
				//serial.writeString("OV ")
				//serial.writeNumber(tm_on_off)
				//serial.writeLine("")
            }
            void_cnt = 0
            break;
          case 4:	// NEC repeat
            if (tm_on_off > 1574 && tm_on_off <= 2922 && tm_duration > 7868 && tm_duration <= 14612) {
                // L4T=2248 1574<2922	H16T+L4T=11240	7868<14612
                void_cnt = 0
            }
            break;
        }
    }


    function enableIrDetection(pin: DigitalPin) {
        pins.setPull(pin, PinPullMode.PullNone);

        pins.onPulsed(pin, PulseValue.High, () => {
            // LOW
            tm_now = control.micros()
            tm_off = pins.pulseDuration()
            tm_dur = tm_now - tm_last
            tm_last = tm_now
            check_pulse(tm_off, tm_dur)
        });
    }


    function initIrWork() {
        irType = 0			// NEC,PNASONIC,SONY
        state = 0		// 受信フェーズ 0:Leader待ち 1:ビット受信中 2:受信完了
        bits = 0			// 受信ビットカウンタ
        tm_now = 0
        tm_off = 0
        tm_dur = 0
        tm_last = 0
        clear_buff()
    }


    /**
     * Connects to the IR receiver module at the specified pin and configures the IR protocol.
     * @param pin IR receiver pin, eg: DigitalPin.P0
     */
    //% blockId="ir_connect_receiver"
    //% block="IRセンサーを %pin に接続"			//"connect IR receiver at pin %pin "
    //% pin.fieldEditor="gridpicker"
    //% pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false"
    //% weight=90
    export function connectIrReceiver(
        pin: DigitalPin
    ): void {

        initIrWork();
        enableIrDetection(pin);

        control.inBackground(() => {
            let cnt = 0
            while (true) {
                dbg_cnt = dbg_cnt + 1
                if( state === 1 ){
                    cnt = cnt +1
                    if( cnt > 10 ){		//20ms*10
                        initIrWork();
                        //serial.writeLine("TO")
                    }
                }else{
                    cnt = 0
                }
                void_cnt = void_cnt + 1
                if (void_cnt === 10){		//20ms*10
                    //void_cnt = 0
                    last_address_data = 0
                    //serial.writeLine("void")
                }
                basic.pause(20)
            }
        })
    }


    /**
     * Returns the IR ddress-command as 16-bit binary.
     */
    //% blockId=ir_recieved_address_command
    //% block="IRデータ"			//"IR address command"
    //% weight=71
    export function irAddressCommand(): number {
        initIrWork();
        return last_address_data
    }

    /**
     * Returns the IR command as 8-bit binary.
     */
    //% blockId=ir_recieved_command
    //% block="IRコマンド"		//"IR command"
    //% weight=72
    export function irCommand(): number {
        initIrWork();
        return (last_address_data & 255)
    }

    /**
     * Returns true if any IR data was received since the last call of this function. False otherwise.
     */
    //% blockId=ir_received
    //% block="IR受信？"		//"IR data was received"
    //% weight=80
    export function irDataReceived(): boolean {
        if (state >= 2) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns state. (DEBUG)
     */
    //% blockId=ir_state
    //% block="IR status"
    //% weight=11
    //% blockHidden=false
    export function irState(): number {
        return state
    }

    /**
     * Returns bits. (DEBUG)
     */
    //% blockId=ir_bits
    //% block="IR_recieved_bits"
    //% weight=12
    //% blockHidden=false
    export function ir_recieved_bits(): number {
        return bits
    }

    /**
     * Returns all data as hexadecimal string. (DEBUG)
     */
    //% blockId=ir_all_hex
    //% block="IR all hex"
    //% weight=13
    //% blockHidden=false
    export function irAllHex(): string {
		let str = ""
        for (let i = (bits-1)/8; i >= 0; i--) {
            str = str + byte2hex(work_buff[i])
        }
        return str
    }

    /**
     * Returns counter 20ms tick. (DEBUG)
     */
    //% blockId=ir_counter
    //% block="IR counter"
    //% weight=10
    //% blockHidden=false
    export function irCounter(): number {
        return dbg_cnt
    }

}
