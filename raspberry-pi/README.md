# Raspberry Pi Button Controller

這個資料夾是 Sleep Airline 的樹莓派版本。之後控制會由 GPIO 實體按鈕負責，不需要再從網頁按起飛或降落。

## 接線

建議先用 BCM GPIO17：

- 按鈕一端接 Raspberry Pi 的 GPIO17
- 按鈕另一端接 GND
- 程式會使用樹莓派內建 pull-up，所以不用另外加電阻

## 安裝

在 Raspberry Pi 上安裝 GPIO 套件：

```bash
sudo apt update
sudo apt install -y python3-gpiozero mpg123
```

把專案放到 Raspberry Pi 後，進入這個資料夾：

```bash
cd raspberry-pi
cp .env.example .env
```

編輯 `.env`：

```dotenv
SERVER_URL=https://your-project.vercel.app
PASSENGER_ID=p_001
PASSENGER_NAME=你的名字
GROUP_ID=group_01
GPIO_PIN=17
ROUTE_DIRECTION=auto
DEBOUNCE_SECONDS=1.0
BROADCAST_STYLE=formal_captain
AUDIO_ENABLED=true
AUDIO_PLAYER=mpg123
```

`SERVER_URL` 要換成你的 Vercel 正式網址。`PASSENGER_ID`、`PASSENGER_NAME`、`GROUP_ID` 固定同一位乘客即可。

聲音會使用原本 Vercel 網頁的 `/api/broadcast/speech`，也就是同一組 OpenAI TTS 廣播聲音。樹莓派會把 mp3 下載到暫存檔，再用 `mpg123` 從本機喇叭播放。

## 執行

```bash
python3 button_controller.py
```

啟動後按一次按鈕：

- 如果乘客還沒起飛或已經降落，會呼叫起飛
- 如果乘客正在飛行中，會呼叫降落
- 起飛或降落成功後，會播放原本網頁使用的機長廣播語音

如果沒有聲音，先確認樹莓派音量和輸出裝置：

```bash
alsamixer
```

也可以測試 `mpg123` 是否存在：

```bash
mpg123 --version
```

## 開機自動執行

可以用 systemd 讓 Raspberry Pi 開機後自動啟動。建立服務檔：

```bash
sudo nano /etc/systemd/system/sleep-airline-button.service
```

填入以下內容，請把路徑換成你的專案位置：

```ini
[Unit]
Description=Sleep Airline Raspberry Pi Button
After=network-online.target
Wants=network-online.target

[Service]
WorkingDirectory=/home/pi/SleepAirlineS2-main/raspberry-pi
ExecStart=/usr/bin/python3 /home/pi/SleepAirlineS2-main/raspberry-pi/button_controller.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

啟用：

```bash
sudo systemctl daemon-reload
sudo systemctl enable sleep-airline-button
sudo systemctl start sleep-airline-button
```

查看狀態：

```bash
sudo systemctl status sleep-airline-button
```
