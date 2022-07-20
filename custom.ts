/*
 * PXT for KRC Microbit Control Bord
 * IR remocon recive
 * Copyright 2022 Bitcom 
 *                GNU
 *
 * Version 2022-07-17 0.00 初版
 */
//% weight=100 color=#bc0f11 icon="\uf09e"
namespace KRC_IR {

    let irType = 0			// NEC,PNASONIC,SONY
    let state = 0		// 受信フェーズ　0:Leader待ち 1:ビット受信中 2:受信完了
    let bits = 0			// 受信ビットカウンタ
    let work_buff: number[] = []
    let tm_now = 0
    let tm_off = 0
    let tm_dur = 0
    let tm_last = 0
    //let dbg_pls = 0
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
        if (state === 0) {	// Leader
            if (tm_on_off >= 420 && tm_on_off <= 780) {
                irType = 3;	//SONY
                state = 1;
            }
            if (tm_on_off > 1120 && tm_on_off <= 2080) {
                irType = 2;	//Panasonic
                state = 1;
            }
            if (tm_on_off > 2248 && tm_on_off <= 2922 && tm_duration > 7868 && tm_duration <= 14612) {
                // L4T=2248　1574<2922	H16T+L4T=11240	7868<14612
                irType = 1;	//NEC
                state = 4;	//repeat
            }
            if (tm_on_off >= 3150 && tm_on_off <= 5850) {
                irType = 1;	//NEC
                state = 1;
            }
        } else if (state === 1) { // reciving bit
            if (irType === 1) { // NEC
                // NEC  "0" 1120 "1" 2250
                if (tm_on_off < 1125) {            // low bit
                    make_data(0);
                } else if (tm_on_off < 2197) {	     // high bit
                    make_data(1);
                }
                if (bits >= 32) {
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
                    state = 2
                }
            }
            if (tm_on_off > 2700) {
                state = 3;
				serial.writeString("OV ")
				serial.writeNumber(tm_on_off)
				serial.writeLine("")
            }
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
			//debug pin
			//pins.digitalWritePin(DigitalPin.P0, dbg_pls);
			//dbg_pls = (~dbg_pls) & 1

        });

		//debug pin
		//pins.digitalWritePin(DigitalPin.P0, 1);
        //dbg_pls = 0

    }


    function initIrWork() {

        irType = 0			// NEC,PNASONIC,SONY
        state = 0		// 受信フェーズ　0:Leader待ち 1:ビット受信中 2:受信完了
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
                        serial.writeLine("TO")
                    }
                }else{
                    cnt = 0
                }
                basic.pause(20)
            }
        })

    }


    /**
     * Returns the IR ddress-command  as 16-bit hexadecimal string.
     */
    //% blockId=ir_recieved_address_command_hex
    //% block="IR hex"
    //% weight=30
    export function irHex(): string {
		let str = ""
        if (irType === 1) { // NEC
            str = byte2hex(work_buff[2]) + byte2hex(work_buff[3])
        }
        if (irType === 2) { // Panasonic
            str = byte2hex(work_buff[4]) + byte2hex(work_buff[5])
        }
        if (irType === 3) { // SONY
            str = byte2hex(work_buff[0]) + byte2hex(work_buff[1])
        }
        initIrWork();
        return str
    }

    /**
     * Returns the IR ddress-command as 16-bit binary.
     */
    //% blockId=ir_recieved_address_command
    //% block="IRデータ"			//"IR address command"
    //% weight=31
    export function irAddressCommand(): number {
        let cmd = 0;
        if (irType === 1) { // NEC
            cmd = work_buff[2]*256+work_buff[3]
        }
        if (irType === 2) { // Panasonic
            cmd = work_buff[4]*256+work_buff[5]
        }
        if (irType === 3) { // SONY
            cmd = work_buff[0]
        }
        initIrWork();
        return cmd
    }

    /**
     * Returns the IR command as 8-bit binary.
     */
    //% blockId=ir_recieved_command
    //% block="IRコマンド"		//"IR command"
    //% weight=32
    export function irCommand(): number {
        let cmd = 0;
        if (irType === 1) { // NEC
            cmd = work_buff[2]
        }
        if (irType === 2) { // Panasonic
            cmd = work_buff[4]
        }
        if (irType === 3) { // SONY
            cmd = work_buff[0]
        }
        initIrWork();
        return cmd
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
    //% weight=10
    //% blockHidden=false
    export function irState(): number {
        return state
    }

    /**
     * Returns bits. (DEBUG)
     */
    //% blockId=ir_bits
    //% block="IR_recieved_bits"
    //% weight=11
    //% blockHidden=false
    export function ir_recieved_bits(): number {
        return bits
    }

    /**
     * Returns all data as hexadecimal string. (DEBUG)
     */
    //% blockId=ir_all_hex
    //% block="IR all hex"
    //% weight=12
    //% blockHidden=false
    export function irAllHex(): string {
		let str = ""
        for (let i = 0; i <= (bits+7)/8; i++) {
            str = str + byte2hex(work_buff[i])
        }
        initIrWork();
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
