from abc import ABC, abstractmethod
from typing import Optional
from app.domain.models import UserCreate, UserResponse

class UserRepository(ABC):
    @abstractmethod
    def create_user(self, user: UserCreate, hashed_password: str) -> Optional[UserResponse]:
        pass

    @abstractmethod
    def get_user_by_email(self, email: str) -> Optional[dict]:
        pass

    @abstractmethod
    def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        pass
