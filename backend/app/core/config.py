from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "TonMaiKongPhor"
    DEBUG: bool = True
    DATABASE_URL = "sqlite:///.tonmaikongphor.db"
    MQTT_BROKER: str = "broker.hivemq.com"
    MQTT_PORT: int = 1883
    MQTT_TOPIC: str = "tonmaikongphor/sensors"
    OPENWEATHER_API_KEY : str = ""
    PSI_WEIGHT_SOIL: float = 0.40
    PSI_WEIGHT_TEMP: float = 0.35
    PSI_WEIGHT_LIGHT: float = 0.25

    
    class Config:
        env_file = ".env"


settings = Settings()