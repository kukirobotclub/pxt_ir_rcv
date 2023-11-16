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
 * Version 2023-11-25 2.00 検知ロジック変更onEvent
 */
//% weight=100 color=#bc0f11 icon="\uf09e"
namespace KRC_IR {

    let mark: number[] = []
    let irstate: number[] = []
    let gPulseDuration = 0
    let gPulseDuration_lasttm = 0
    let pulseCnt = 0
    let irType = 0			// NEC,PNASONIC,SONY
    let state = 0		// 受信フェーズ 0:Leader待ち 1:ビット受信中 2:受信完了
    let bits = 0			// 受信ビットカウンタ
    let work_buff: number[] = []
    let last_address_data = 0	// 前回受信したデータ
    let void_cnt = 0		// 無操作カウンタ
    let dbg_cnt = 0
    let gDebugMode = 0

    function toHexChar(decimal: number): string {
        return "0123456789ABCDEF".charAt(decimal)
    }

    function byte2hex(decimal: number): string {
        return toHexChar((decimal >> 4) & 15) + toHexChar(decimal & 15)
    }

    function print_irdata(): void {
        serial.writeNumber(pulseCnt)
        serial.writeString(": ")
        for (let i = 0; i <= pulseCnt; i++) {
            serial.writeNumber(i)
            serial.writeString(" S")
            serial.writeNumber(irstate[i])
            serial.writeString(" ")
            serial.writeNumber(mark[i])
            serial.writeString(",")
        }
        serial.writeLine("")
        pulseCnt = 0
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

    function check_pulse(tm_on_off: number): void {
        switch (state) {
            case 0:	// Leader
                if (tm_on_off >= 2600 && tm_on_off <= 4100) {
                    irType = 3;	//SONY
                    state = 1;
                }
                if (tm_on_off > 4100 && tm_on_off <= 6000) {
                    irType = 2;	//Panasonic
                    state = 1;
                }
                if (tm_on_off > 6000 && tm_on_off <= 8000) {
                    irType = 2;	//Panasonic Repeat	殆ど使われないということ
                    state = 4;
                }
                if (tm_on_off > 8000 && tm_on_off <= 11240) {
                    irType = 1;	//NEC
                    state = 4;	//repeat
                    void_cnt = 0
                }
                if (tm_on_off > 11240 && tm_on_off <= 15736) {
                    irType = 1;	//NEC
                    state = 1;
                }
                break;
            case 1:	// reciving bit
                if (irType === 1) { // NEC
                    // NEC
                    if (tm_on_off < 1686) {            // low bit
                        make_data(0);
                    } else if (tm_on_off < 2600) {	     // high bit
                        make_data(1);
                    }
                    if (bits >= 32) {
                        last_address_data = work_buff[2] + work_buff[3] * 256
                        state = 2
                    }
                }
                if (irType === 2) { // Panasonic
                    // Panasonic
                    if (tm_on_off < 1200) {            // low bit
                        make_data(0);
                    } else if (tm_on_off < 2200) {	     // high bit
                        make_data(1);
                    }
                    if (bits >= 48) {
                        last_address_data = work_buff[4] + work_buff[5] * 256
                        state = 2
                    }
                }
                if (irType === 3) { // SONY
                    // SONY  "0" 1200 "1" 1800
                    if (tm_on_off < 1500) {            // low bit
                        make_data(0);
                    } else if (tm_on_off < 2400) {	     // high bit
                        make_data(1);
                    }
                    if (bits >= 11) {
                        last_address_data = work_buff[0] + work_buff[1] * 256
                        state = 2
                    }
                }
                if (tm_on_off >= 2600) {
                    state = 3;
                    if (gDebugMode) {
                        serial.writeString("OV ")
                        //serial.writeNumber(tm_on_off)
                        //serial.writeLine("")
                    }
                }
                void_cnt = 0
                break;
            case 4:	// NEC repeat
                if (tm_on_off > 7868 && tm_on_off <= 14612) {
                    void_cnt = 0
                }
                break;
        }
    }

    function enableIrDetection(pin: DigitalPin) {
        pins.setPull(pin, PinPullMode.PullNone);
        pins.setEvents(pin, PinEventType.Edge);
    }

    function initIrWork() {
        if (gDebugMode && state  >= 2) {
			print_irdata()
            serial.writeNumber(bits)
            serial.writeString(": ")
            serial.writeNumber(irType)
            serial.writeString(": ")
            for (let i = 0; i <= 7; i++) {
                serial.writeString(byte2hex(work_buff[i]) + " ")
            }
            serial.writeLine("")
        }
        irType = 0			// NEC,PNASONIC,SONY
        state = 0		// 受信フェーズ 0:Leader待ち 1:ビット受信中 2:受信完了
        bits = 0			// 受信ビットカウンタ
        clear_buff()
    }

    control.onEvent(EventBusSource.MICROBIT_ID_IO_P2, EventBusValue.MICROBIT_PIN_EVT_FALL, function () {
        let tm = 0
        tm = control.eventTimestamp()
        gPulseDuration = tm - gPulseDuration_lasttm;
        if (gPulseDuration_lasttm > 0) {
            check_pulse(gPulseDuration)
        }
        gPulseDuration_lasttm = tm
        void_cnt = 0
        if (pulseCnt < 128) {
            mark[pulseCnt] = gPulseDuration
            irstate[pulseCnt] = state
            pulseCnt = pulseCnt + 1
        }
    })
    
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
                if (state === 1) {
                    cnt = cnt + 1
                    if (cnt > 10) {		//20ms*10
                        initIrWork();
                        if (gDebugMode) {
                            serial.writeLine("TO")
							print_irdata()
                        }
                    }
                } else {
                    cnt = 0
                }
                void_cnt = void_cnt + 1
                if (void_cnt === 10) {		//20ms*10
                    //void_cnt = 0
                    state = 0;
                    irType = 0;
                    bits = 0;
                    clear_buff();
                    irstate[pulseCnt] = state
                    last_address_data = 0
                    if (gDebugMode) {
                        serial.writeLine("void")
                    }
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
    //% advanced=true
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
    //% advanced=true
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
    //% advanced=true
    //% blockHidden=false
    export function irAllHex(): string {
        let str = ""
        for (let i = (bits - 1) / 8; i >= 0; i--) {
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
    //% advanced=true
    //% blockHidden=false
    export function irCounter(): number {
        return dbg_cnt
    }

    /**
     * Set/Reset DEBUG mode. (DEBUG)
     */
    //% blockId="ir_debug_mode
    //% block="デバッグモードを |%value に設定"
    //% weight=9
    //% advanced=true
    //% blockHidden=false
    export function IrDebugMode(value: number): void {
        gDebugMode = value
    }

}
