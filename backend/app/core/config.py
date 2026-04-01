from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "TonMaiKongPhor"
    DEBUG: bool = True
    DATABASE_URL: str = ""
    MQTT_BROKER: str = "broker.hivemq.com"
    MQTT_PORT: int = 1883
    MQTT_TOPIC: str = "tonmaikongphor/sensors"
    OPENWEATHER_API_KEY : str = ""
    PSI_WEIGHT_SOIL: float = 0.40
    PSI_WEIGHT_TEMP: float = 0.35
    PSI_WEIGHT_LIGHT: float = 0.25
    DB_USER: str = ""
    DB_PASS: str = ""
    DB_HOST: str = "iot.cpe.ku.ac.th"
    DB_PORT: int = 3306
    DB_NAME: str = ""

    
    class Config:
        env_file = ".env"


settings = Settings()