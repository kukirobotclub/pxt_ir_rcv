// テストはここに来ます。このパッケージが拡張機能として使用されるときにはコンパイルされません。
basic.forever(function () {
    KRC_IR.connectIrReceiver(DigitalPin.P2)
    serial.setBaudRate(BaudRate.BaudRate115200)
})
