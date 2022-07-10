// テストはここに来ます。このパッケージが拡張機能として使用されるときにはコンパイルされません。
RobotCoders.onIrButton(IrButton.B0_2, IrButtonAction.Pressed, function () {
    led.toggle(2, 0)
})
RobotCoders.onIrButton(IrButton.B1_2, IrButtonAction.Pressed, function () {
    led.toggle(2, 1)
})
RobotCoders.onIrButton(IrButton.B3_0, IrButtonAction.Pressed, function () {
    led.toggle(0, 3)
})
RobotCoders.onIrButton(IrButton.B1_0, IrButtonAction.Pressed, function () {
    led.toggle(0, 1)
})
RobotCoders.onIrButton(IrButton.B2_2, IrButtonAction.Pressed, function () {
    led.toggle(2, 2)
})
RobotCoders.onIrButton(IrButton.B6_0, IrButtonAction.Pressed, function () {
    led.toggle(4, 0)
})
RobotCoders.onIrButton(IrButton.B5_1, IrButtonAction.Pressed, function () {
    led.toggle(3, 1)
})
RobotCoders.onIrButton(IrButton.B6_1, IrButtonAction.Pressed, function () {
    led.toggle(4, 1)
})
RobotCoders.onIrButton(IrButton.B4_2, IrButtonAction.Pressed, function () {
    led.toggle(2, 4)
})
RobotCoders.onIrButton(IrButton.B5_0, IrButtonAction.Pressed, function () {
    led.toggle(3, 0)
})
RobotCoders.onIrButton(IrButton.B6_2, IrButtonAction.Pressed, function () {
    led.toggle(4, 2)
})
RobotCoders.onIrButton(IrButton.B0_0, IrButtonAction.Pressed, function () {
    led.toggle(0, 0)
})
RobotCoders.onIrButton(IrButton.B5_2, IrButtonAction.Pressed, function () {
    led.toggle(3, 2)
})
RobotCoders.onIrButton(IrButton.B2_0, IrButtonAction.Pressed, function () {
    led.toggle(0, 2)
})
RobotCoders.onIrButton(IrButton.B3_1, IrButtonAction.Pressed, function () {
    led.toggle(1, 3)
})
RobotCoders.onIrButton(IrButton.B3_2, IrButtonAction.Pressed, function () {
    led.toggle(2, 3)
})
RobotCoders.onIrButton(IrButton.B4_1, IrButtonAction.Pressed, function () {
    led.toggle(1, 4)
})
RobotCoders.onIrButton(IrButton.B2_1, IrButtonAction.Pressed, function () {
    led.toggle(1, 2)
})
RobotCoders.onIrButton(IrButton.B4_0, IrButtonAction.Pressed, function () {
    led.toggle(0, 4)
})
RobotCoders.onIrButton(IrButton.Any, IrButtonAction.Pressed, function () {
    led.toggle(4, 4)
    serial.writeLine(RobotCoders.irDatagram())
})
RobotCoders.onIrButton(IrButton.B0_1, IrButtonAction.Pressed, function () {
    led.toggle(1, 0)
})
RobotCoders.onIrButton(IrButton.B1_1, IrButtonAction.Pressed, function () {
    led.toggle(1, 1)
})
basic.forever(function () {
    RobotCoders.connectIrReceiver(DigitalPin.P2, IrProtocol.NEC)
    serial.setBaudRate(BaudRate.BaudRate115200)
})
