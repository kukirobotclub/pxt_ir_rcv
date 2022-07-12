const enum IrButton {
    //% block="B0_0"
    B0_0 = 0xA2,
    //% block="B0_1"
    B0_1 = 0x62,
    //% block="B0_2"
    B0_2 = 0xE2,
    //% block="B1_0"
    B1_0 = 0x22,
    //% block="B1_1"
    B1_1 = 0x02,
    //% block="B1_2"
    B1_2 = 0xC2,
    //% block="B2_0"
    B2_0 = 0xE0,
    //% block="B2_1"
    B2_1 = 0xA8,
    //% block="B2_2"
    B2_2 = 0x90,
    //% block="B3_0"
    B3_0 = 0x68,
    //% block="B3_1"
    B3_1 = 0x98,
    //% block="B3_2"
    B3_2 = 0xB0,
    //% block="B4_0"
    B4_0 = 0x30,
    //% block="B4_1"
    B4_1 = 0x18,
    //% block="B4_2"
    B4_2 = 0x7a,
    //% block="B5_0"
    B5_0 = 0x10,
    //% block="B5_1"
    B5_1 = 0x38,
    //% block="B5_2"
    B5_2 = 0x5A,
    //% block="B6_0"
    B6_0 = 0x42,
    //% block="B6_1"
    B6_1 = 0x4A,
    //% block="B6_2"
    B6_2 = 0x52,
    //% block="Any"
    Any = -1,
}

const enum IrButtonAction {
    //% block="pressed"
    Pressed = 0,
    //% block="released"
    Released = 1,
}

const enum IrProtocol {
    //% block="Keyestudio"
    Keyestudio = 0,
    //% block="NEC"
    NEC = 1,
    //% block="NEC_OTHER"
    NEC_OTHER = 2,
}

/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon="\uf013"
namespace KRC_IR {

    let irState: IrState;

    const IR_REPEAT = 256;
    const IR_INCOMPLETE = 257;
    const IR_DATAGRAM = 258;

    const REPEAT_TIMEOUT_MS = 120;

    interface IrState {
        protocol: IrProtocol;			// NEC,Keystudio
        hasNewDatagram: boolean;		// データが受信完了された
        bitsReceived: uint8;			// 受信ビットカウンタ
		extraSectionBits: uint16;		// Extraコード
        addressSectionBits: uint16;
        commandSectionBits: uint16;
		state: number;					// 受信ステート
		firstdata: boolean;				// 最初のデータを保存するためのフラグ
		extraChecked: boolean;			// Extraコード回避用のフラグ
		vender: uint8;					// 受信データから判断した赤外線フォーマット
        hiword: uint16;					//受信中のデータ
        loword: uint16;					//
        activeCommand: number;			//受信データのコマンド部分(NEC)
        repeatTimeout: number;
        onIrButtonPressed: IrButtonHandler[];
        onIrButtonReleased: IrButtonHandler[];
        onIrDatagram: () => void;
    }

    
    class IrButtonHandler {
        irButton: IrButton;
        onEvent: () => void;

        constructor(
            irButton: IrButton,
            onEvent: () => void
        ) {
            this.irButton = irButton;
            this.onEvent = onEvent;
        }
    }

    function appendBitToDatagram(bit: number): number {
        irState.bitsReceived += 1;

        if ((irState.bitsReceived <= 8) && (irState.extraChecked === false)) {
            irState.hiword = (irState.hiword << 1) + bit;
            if (irState.protocol === IrProtocol.Keyestudio && bit === 1) {
                // recover from missing message bits at the beginning
                // Keyestudio address is 0 and thus missing bits can be detected
                // by checking for the first inverse address bit (which is a 1)
                irState.bitsReceived = 9;
                irState.hiword = 1;
            }
        } else if (irState.bitsReceived <= 16) {
            irState.hiword = (irState.hiword << 1) + bit;
        } else if (irState.bitsReceived <= 32) {
            irState.loword = (irState.loword << 1) + bit;
        }

        if ((irState.bitsReceived === 16) && (irState.extraChecked === false)) {
			//serial.writeString( ir_rec_to16BitHex(irState.hiword & 0xffff) + " ");
				irState.extraChecked = true;
				//if ((irState.hiword & 0xffff) === 0x4004/*PANASONIC_VENDOR_ID_CODE*/) {	//0x2002
                //    irState.vender = 1/*PANASONIC*/;
                //} else if ((irState.hiword & 0xffff) === 0x555A/*SHARP_VENDOR_ID_CODE*/) {	//0x5AAA
                //    irState.vender = 2/*KASEIKYO_SHARP*/;
                //} else if ((irState.hiword & 0xffff) === 0x2A4C/*DENON_VENDOR_ID_CODE*/) {	//0x3254
                //    irState.vender = 3/*KASEIKYO_DENON*/;
                //} else if ((irState.hiword & 0xffff) === 0xC080/*JVC_VENDOR_ID_CODE*/) {	//0x0103
                //    irState.vender = 4/*KASEIKYO_JVC*/;
                //} else if ((irState.hiword & 0xffff) === 0xC4D3/*MITSUBISHI_VENDOR_ID_CODE*/) {	//0xCB23
                //    irState.vender = 5/*KASEIKYO_MITSUBISHI*/;
                //}
				if (irState.vender === 2) {
                    irState.extraSectionBits = irState.hiword & 0xffff;
					irState.bitsReceived = 0;
				}
		}

        if (irState.bitsReceived === 32) {

			serial.writeNumber( irState.vender );
			serial.writeString( ":" );
			serial.writeString( ir_rec_to16BitHex( irState.extraSectionBits + " ");
			serial.writeString( ":" );
			serial.writeString( ir_rec_to16BitHex(irState.hiword & 0xffff) + ir_rec_to16BitHex(irState.loword & 0xffff) + " ");

            if (irState.firstdata ){
              irState.addressSectionBits = irState.hiword & 0xffff;
              irState.commandSectionBits = irState.loword & 0xffff;
              irState.firstdata = false;
            }
            return IR_DATAGRAM;
        } else {
            return IR_INCOMPLETE;
        }
    }

    function decode(markAndSpace: number): number {
      if (state === 1) { // reciving bit
        if (irState.vender === 1) { // NEC
          // NEC  "0" 1120 "1" 2250
          if (markAndSpace < 1456) {            // low bit
            return appendBitToDatagram(0);
          } else if (markAndSpace < 2700) {	     // high bit
            return appendBitToDatagram(1);
          }
        }
        if (irState.vender === 2) { // Panasonic
          // Panasonic "0" 800 "1" 1600
          if (markAndSpace < 1100) {            // low bit
            return appendBitToDatagram(0);
          } else if (markAndSpace < 2100) {	     // high bit
            return appendBitToDatagram(1);
          }
        }
        if (irState.vender === 2) { // SONY
           // SONY  "0" 1200 "1" 1800
          if (markAndSpace < 1500) {            // low bit
            return appendBitToDatagram(0);
          } else if (markAndSpace < 2400) {	     // high bit
            return appendBitToDatagram(1);
          }
        }

		//規定以上長いときは初期化しちゃってる
        irState.state = 0;
        irState.bitsReceived = 0;
		irState.extraChecked = false;
		irState.vender = 0;

        if (markAndSpace < 12500) {
            // Repeat detected
            return IR_REPEAT;
        } else if (markAndSpace < 14500) {
            // Start detected
            return IR_INCOMPLETE;
        } else {
            return IR_INCOMPLETE;
        }

      }else if (state === 0) {	// Leader
        // TYP Leader NEC 13500us   Panasonic 4800us  SONY 3000us
        if (markAndSpace >= 2100 && markAndSpace <= 3900) {
		    irState.vender = 3;	//SONY
			irState.state = 1;
		}
        if (markAndSpace > 3900 && markAndSpace <= 6240) {
		    irState.vender = 2;	//Panasonic
			irState.state = 1;
		}
        if (markAndSpace >= 9450 && markAndSpace <= 15000) {
		    irState.vender = 1;	//NEC
			irState.state = 1;
		}
		
      }
    }

    function enableIrMarkSpaceDetection(pin: DigitalPin) {
        pins.setPull(pin, PinPullMode.PullNone);

        let mark = 0;
        let space = 0;

        pins.onPulsed(pin, PulseValue.Low, () => {
            // HIGH, see https://github.com/microsoft/pxt-microbit/issues/1416
            mark = pins.pulseDuration();
        });

        pins.onPulsed(pin, PulseValue.High, () => {
            // LOW
            space = pins.pulseDuration();
            const status = decode(mark + space);

            if (status !== IR_INCOMPLETE) {
                handleIrEvent(status);
            }
        });
    }

    function handleIrEvent(irEvent: number) {

        // Refresh repeat timer
        if (irEvent === IR_DATAGRAM || irEvent === IR_REPEAT) {
            irState.repeatTimeout = input.runningTime() + REPEAT_TIMEOUT_MS;
        }

        if (irEvent === IR_DATAGRAM) {
            irState.hasNewDatagram = true;

            if (irState.onIrDatagram) {
                background.schedule(irState.onIrDatagram, background.Thread.UserCallback, background.Mode.Once, 0);
            }

            const newCommand = irState.commandSectionBits >> 8;
           
            // Process a new command
            if (newCommand !== irState.activeCommand) {

                if (irState.activeCommand >= 0) {
                    const releasedHandler = irState.onIrButtonReleased.find(h => h.irButton === irState.activeCommand);
                    if (releasedHandler) {
                        background.schedule(releasedHandler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                    }else{
                        const anyHandler = irState.onIrButtonPressed.find(h => IrButton.Any === h.irButton);
                        if (anyHandler)
                            background.schedule(anyHandler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                    }
                }


                const pressedHandler = irState.onIrButtonPressed.find(h => h.irButton === newCommand);

                if (pressedHandler) {
                    background.schedule(pressedHandler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                }else{
                    const anyHandler = irState.onIrButtonPressed.find(h => IrButton.Any === h.irButton);
                    if(anyHandler)
                        background.schedule(anyHandler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                }

                irState.activeCommand = newCommand;
            }
        }
    }

    function initIrState() {
        if (irState) {
            return;
        }

        irState = {
            protocol: undefined,
            bitsReceived: 0,
            hasNewDatagram: false,
            extraSectionBits: 0,
            addressSectionBits: 0,
            commandSectionBits: 0,
    		extraChecked: false,
    		vender: 0,
			state: 0,
            firstdata: true,
            hiword: 0, // TODO replace with uint32
            loword: 0,
            activeCommand: -1,
            repeatTimeout: 0,
            onIrButtonPressed: [],
            onIrButtonReleased: [],
            onIrDatagram: undefined,
        };
    }

    export namespace background {

        export enum Thread {
            Priority = 0,
            UserCallback = 1,
        }

        export enum Mode {
            Repeat,
            Once,
        }

        class Executor {
            _newJobs: Job[] = undefined;
            _jobsToRemove: number[] = undefined;
            _pause: number = 100;
            _type: Thread;

            constructor(type: Thread) {
                this._type = type;
                this._newJobs = [];
                this._jobsToRemove = [];
                control.runInParallel(() => this.loop());
            }

            push(task: () => void, delay: number, mode: Mode): number {
                if (delay > 0 && delay < this._pause && mode === Mode.Repeat) {
                    this._pause = Math.floor(delay);
                }
                const job = new Job(task, delay, mode);
                this._newJobs.push(job);
                return job.id;
            }

            cancel(jobId: number) {
                this._jobsToRemove.push(jobId);
            }

            loop(): void {
                const _jobs: Job[] = [];

                let previous = control.millis();

                while (true) {
                    const now = control.millis();
                    const delta = now - previous;
                    previous = now;

                    // Add new jobs
                    this._newJobs.forEach(function (job: Job, index: number) {
                        _jobs.push(job);
                    });
                    this._newJobs = [];

                    // Cancel jobs
                    this._jobsToRemove.forEach(function (jobId: number, index: number) {
                        for (let i = _jobs.length - 1; i >= 0; i--) {
                            const job = _jobs[i];
                            if (job.id == jobId) {
                                _jobs.removeAt(i);
                                break;
                            }
                        }
                    });
                    this._jobsToRemove = []


                    // Execute all jobs
                    if (this._type === Thread.Priority) {
                        // newest first
                        for (let i = _jobs.length - 1; i >= 0; i--) {
                            if (_jobs[i].run(delta)) {
                                this._jobsToRemove.push(_jobs[i].id)
                            }
                        }
                    } else {
                        // Execute in order of schedule
                        for (let i = 0; i < _jobs.length; i++) {
                            if (_jobs[i].run(delta)) {
                                this._jobsToRemove.push(_jobs[i].id)
                            }
                        }
                    }

                    basic.pause(this._pause);
                }
            }
        }

        class Job {
            id: number;
            func: () => void;
            delay: number;
            remaining: number;
            mode: Mode;

            constructor(func: () => void, delay: number, mode: Mode) {
                this.id = randint(0, 2147483647)
                this.func = func;
                this.delay = delay;
                this.remaining = delay;
                this.mode = mode;
            }

            run(delta: number): boolean {
                if (delta <= 0) {
                    return false;
                }

                this.remaining -= delta;
                if (this.remaining > 0) {
                    return false;
                }

                switch (this.mode) {
                    case Mode.Once:
                        this.func();
                        basic.pause(0);
                        return true;
                    case Mode.Repeat:
                        this.func();
                        this.remaining = this.delay;
                        basic.pause(0);
                        return false;
                }
            }
        }

        const queues: Executor[] = [];

        export function schedule(
            func: () => void,
            type: Thread,
            mode: Mode,
            delay: number,
        ): number {
            if (!func || delay < 0) return 0;

            if (!queues[type]) {
                queues[type] = new Executor(type);
            }

            return queues[type].push(func, delay, mode);
        }

        export function remove(type: Thread, jobId: number): void {
            if (queues[type]) {
                queues[type].cancel(jobId);
            }
        }
    }


    /**
     * Connects to the IR receiver module at the specified pin and configures the IR protocol.
     * @param pin IR receiver pin, eg: DigitalPin.P0
     * @param protocol IR protocol, eg: IrProtocol.NEC_OTHER
     */
    //% blockId="RBBit_infrared_connect_receiver"
    //% block="connect IR receiver at pin %pin and decode %protocol"
    //% pin.fieldEditor="gridpicker"
    //% pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false"
    //% weight=90
    export function connectIrReceiver(
        pin: DigitalPin,
        protocol: IrProtocol
    ): void {
        initIrState();

        if (irState.protocol) {
            return;
        }

        irState.protocol = protocol;

        enableIrMarkSpaceDetection(pin);

        background.schedule(notifyIrEvents, background.Thread.Priority, background.Mode.Repeat, REPEAT_TIMEOUT_MS);
    }

    function notifyIrEvents() {
        if (irState.activeCommand === -1) {
            // skip to save CPU cylces
        } else {
            const now = input.runningTime();
            if (now > irState.repeatTimeout) {
                // repeat timed out
                irState.firstdata = true;
                const handler = irState.onIrButtonReleased.find(h => h.irButton === irState.activeCommand || IrButton.Any === h.irButton);
                if (handler) {
                    background.schedule(handler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                }

        		irState.extraChecked = false;
				irState.state = 0;
        		irState.vender = 0;
                irState.bitsReceived = 0;
                irState.activeCommand = -1;
            }
        }
    }


    /**
 * Do something when a specific button is pressed or released on the remote control.
 * @param button the button to be checked
 * @param action the trigger action
 * @param handler body code to run when the event is raised
 */
    //% blockId=RBBit_infrared_on_ir_button
    //% block="on IR button | %button | %action"
    //% button.fieldEditor="gridpicker"
    //% button.fieldOptions.columns=3
    //% button.fieldOptions.tooltips="false"
    //% weight=50
    export function onIrButton(
        button: IrButton,
        action: IrButtonAction,
        handler: () => void
    ) {
        initIrState();

        
        if (action === IrButtonAction.Pressed) {
            irState.onIrButtonPressed.push(new IrButtonHandler(button, handler));
        }
        else {
            //if(button === IrButton.B0_1)
            //    irState.onIrButtonReleased.push(new IrButtonHandler(button, handler));
            irState.onIrButtonReleased.push(new IrButtonHandler(button, handler));
        }
    }

    /**
     * Returns the code of the IR button that was pressed last. Returns -1 (IrButton.Any) if no button has been pressed yet.
     */
    //% blockId=RBBit_infrared_ir_button_pressed
    //% block="IR button"
    //% weight=70
    export function irButton(): number {
        basic.pause(0); // Yield to support background processing when called in tight loops
        if (!irState) {
            return IrButton.Any;
        }
        return irState.commandSectionBits >> 8;
    }

    /**
     * Do something when an IR datagram is received.
     * @param handler body code to run when the event is raised
     */
    //% blockId=RBBit_infrared_on_ir_datagram
    //% block="on IR datagram received"
    //% weight=40
    export function onIrDatagram(handler: () => void) {
        initIrState();
        irState.onIrDatagram = handler;
    }

    /**
     * Returns the IR datagram as 32-bit hexadecimal string.
     * The last received datagram is returned or "0x00000000" if no data has been received yet.
     */
    //% blockId=RBBit_infrared_ir_datagram
    //% block="IR datagram"
    //% weight=30
    export function irDatagram(): string {
        basic.pause(0); // Yield to support background processing when called in tight loops
        initIrState();
        return (
            "0x" +
            ir_rec_to16BitHex(irState.addressSectionBits) +  
            ir_rec_to16BitHex(irState.commandSectionBits)
        );
    }

    /**
     * Returns true if any IR data was received since the last call of this function. False otherwise.
     */
    //% blockId=RBBit_infrared_was_any_ir_datagram_received
    //% block="IR data was received"
    //% weight=80
    export function wasIrDataReceived(): boolean {
        basic.pause(0); // Yield to support background processing when called in tight loops
        initIrState();
        if (irState.hasNewDatagram) {
            irState.hasNewDatagram = false;
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns the command code of a specific IR button.
     * @param button the button
     */
    //% blockId=RBBit_infrared_button_code
    //% button.fieldEditor="gridpicker"
    //% button.fieldOptions.columns=3
    //% button.fieldOptions.tooltips="false"
    //% block="IR button code %button"
    //% weight=60
    export function irButtonCode(button: IrButton): number {
        basic.pause(0); // Yield to support background processing when called in tight loops
        return button as number;
    }

    function ir_rec_to16BitHex(value: number): string {
        let hex = "";
        for (let pos = 0; pos < 4; pos++) {
            let remainder = value % 16;
            if (remainder < 10) {
                hex = remainder.toString() + hex;
            } else {
                hex = String.fromCharCode(55 + remainder) + hex;
            }
            value = Math.idiv(value, 16);
        }
        return hex;
    }
}