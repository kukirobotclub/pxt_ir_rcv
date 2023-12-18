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
 * Version 2023-11-16 2.00 検知ロジック変更onEvent
 * Version 2023-12-16 3.00 データ渡し方法の変更
 */
//% weight=100 color=#bc0f11 icon="\uf09e"
namespace KRC_IR {

    let mark: number[] = []		// debug mode
    let irstate: number[] = []		// debug mode
    let evtTime: number[] = []	// debug mode
    let pulseCnt = 0		// debug mode
    let gPulseDuration = 0			// パルス期間
    let gPulseDuration_lasttm = 0	// 前回パルスのタイムスタンプ
    let irType = 0			// NEC,PNASONIC,SONY
    let state = 0		// 受信フェーズ 0:Leader待ち 1:NECビット受信中 2:Panasonicビット受信中 3:SONYビット受信中
    let bits = 0			// 受信ビットカウンタ
    let work_buff: number[] = []	// 組み立てバッファ
    let ir_data = 0	     // 受信したデータ(完成した時点で更新)
    let last_ir_data = 0 // リピート対象のデータ
    let ir_repeat = 0    // 1:Repeat受信
    let void_cnt = 0		// 無操作カウンタ
    let dbg_cnt = 0
    let gDebugMode = 0		// debug mode

    function toHexChar(decimal: number): string {
        return "0123456789ABCDEF".charAt(decimal)
    }

    function byte2hex(decimal: number): string {
        return toHexChar((decimal >> 4) & 15) + toHexChar(decimal & 15)
    }

    function print_irdata_debug(): void {
        serial.writeNumber(pulseCnt)
        serial.writeString(": ")
        for (let i = 0; i <= pulseCnt; i++) {
            serial.writeNumber(i)
            serial.writeString(" ")
            serial.writeNumber(evtTime[i])
            serial.writeString(" S")
            serial.writeNumber(irstate[i])
            serial.writeString(" ")
            serial.writeNumber(mark[i])
            serial.writeString(",")
        }
        serial.writeLine("")
        pulseCnt = 0
    }

    function print_irdata(): void {
        serial.writeString("[ ")
        serial.writeNumber(bits)
        serial.writeString(": ")
        serial.writeNumber(irType)
        serial.writeString(": ")
        for (let i = 0; i <= 7; i++) {
            serial.writeString(byte2hex(work_buff[i]) + " ")
        }
        serial.writeLine("]")
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
                    state = 3;
                }
                if (tm_on_off > 4100 && tm_on_off <= 6000) {
                    irType = 2;	//Panasonic
                    state = 2;
                }
                if (tm_on_off > 6000 && tm_on_off <= 8000) {
                    irType = 2;	//Panasonic Repeat	殆ど使われないということ
                    ir_data = last_ir_data
                    ir_repeat = 1	//repeat
                    state = 0
                }
                if (tm_on_off > 8000 && tm_on_off <= 11240) {
                    irType = 1;	//NEC
                    ir_data = last_ir_data
                    ir_repeat = 1	//repeat
                    state = 0
                }
                if (tm_on_off > 11240 && tm_on_off <= 15736) {
                    irType = 1;	//NEC
                    state = 1;
                }
                break;
            case 1:	// reciving bit NEC
                // NEC
                if (tm_on_off < 1686) {            // low bit
                    make_data(0);
                } else if (tm_on_off < 2600) {	     // high bit
                    make_data(1);
                } else {
                    initIrWork()
                    if (gDebugMode) {
                        serial.writeString("OV ")
                    }
                }
                if (bits >= 32) {
                    ir_data = work_buff[2] + work_buff[3] * 256
                    last_ir_data = ir_data
                    if (gDebugMode) {
                        print_irdata()
                    }
                    initIrWork()
                }
                break;
            case 2:	// reciving bit Panasonic
                // Panasonic
                if (tm_on_off < 1200) {            // low bit
                    make_data(0);
                } else if (tm_on_off < 2200) {	     // high bit
                    make_data(1);
                } else {
                    initIrWork()
                    if (gDebugMode) {
                        serial.writeString("OV ")
                    }
                }
                if (bits >= 48) {
                    ir_data = work_buff[4] + work_buff[5] * 256
                    last_ir_data = ir_data
                    if (gDebugMode) {
                        print_irdata()
                    }
                    initIrWork()
                }
                break;
            case 3:	// reciving bit  SONY
                // SONY  "0" 1200 "1" 1800
                if (tm_on_off < 1500) {            // low bit
                    make_data(0);
                } else if (tm_on_off < 2400) {	     // high bit
                    make_data(1);
                } else {
                    initIrWork()
                    if (gDebugMode) {
                        serial.writeString("OV ")
                    }
                }
                if (bits >= 11) {
                    ir_data = work_buff[0] + work_buff[1] * 256
                    last_ir_data = ir_data
                    if (gDebugMode) {
                        print_irdata()
                    }
                    initIrWork()
                }
                break;
        }
    }

    function enableIrDetection(pin: DigitalPin) {
        pins.setPull(pin, PinPullMode.PullNone);
        pins.setEvents(pin, PinEventType.Edge);
    }

    function initIrWork() {
        state = 0		// 受信フェーズ 0:Leader待ち 1:ビット受信中
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
            evtTime[pulseCnt] = input.runningTimeMicros()
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

        for (let i = 0; i < 128; i++) {
            mark[i] = 0
            irstate[i] = 0
            evtTime[i] = 0
        }

        initIrWork();
        enableIrDetection(pin);

        control.inBackground(() => {
            while (true) {
                dbg_cnt = dbg_cnt + 1
                if (ir_data != 0 || state > 0) {
                    void_cnt = void_cnt + 1
                    if (void_cnt >= 10) {		//20ms*10
                        mark[pulseCnt] = -1
                        irstate[pulseCnt] = state
                        evtTime[pulseCnt] = input.runningTimeMicros()
                        pulseCnt = pulseCnt + 1
                        ir_data = 0
                        last_ir_data = 0
                        ir_repeat = 0
                        if (gDebugMode) {
                            serial.writeLine("TO")
                            print_irdata_debug()
                        }
                        irType = 0			// NEC,PNASONIC,SONY
                        initIrWork();
                    }
                }
                basic.pause(20)
            }
        })
    }

    /**
     * Clear the buffered IR data.
     */
    //% blockId=ir_recieved_clear
    //% block="IRクリア"			//"IR data clear
    //% weight=70
    export function irClear(): void {
        ir_data = 0
        last_ir_data = 0
        ir_repeat = 0
        irType = 0			// NEC,PNASONIC,SONY
        initIrWork();
    }

    /**
     * Returns the IR ddress-command as 16-bit binary.
     */
    //% blockId=ir_recieved_address_command
    //% block="IRデータ"			//"IR address command"
    //% weight=71
    export function irAddressCommand(): number {
        let ret = ir_data
        ir_data = 0
        ir_repeat = 0
        return ret
    }

    /**
     * Returns the IR command as 8-bit binary.
     */
    //% blockId=ir_recieved_command
    //% block="IRコマンド"		//"IR command"
    //% weight=72
    export function irCommand(): number {
        let ret = (ir_data & 255)
        ir_data = 0
        ir_repeat = 0
        return ret
    }

    /**
     * Returns true if any IR data was received since the last call of this function. False otherwise.
     */
    //% blockId=ir_received
    //% block="IR受信？"		//"IR data was received"
    //% weight=80
    export function irDataReceived(): boolean {
        if (ir_data != 0) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns repeat code.
     */
    //% blockId=repeat_received
    //% block="Repeat受信？"
    //% weight=81
    export function repeatReceived(): boolean {
        if (ir_repeat != 0) {
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
    //% advanced=true
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
    //% advanced=true
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
    //% advanced=true
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
    //% blockHidden=false
    //% advanced=true
    export function irCounter(): number {
        return dbg_cnt
    }

    /**
     * Set/Reset DEBUG mode. (DEBUG)
     */
    //% blockId="ir_debug_mode
    //% block="デバッグモードを |%value に設定"
    //% weight=9
    //% blockHidden=false
    //% advanced=true
    export function IrDebugMode(value: number): void {
        gDebugMode = value
    }

    /**
     * Print debug status. (DEBUG)
     */
    //% blockId="ir_debug_print
    //% block="デバッグ情報シリアルに出力"
    //% weight=8
    //% blockHidden=true
    //% advanced=true
    export function IrDebugPrint(): void {
        print_irdata()
        print_irdata_debug()
    }

}
