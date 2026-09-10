from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..security import get_current_shop

router = APIRouter(prefix="/api/shop", tags=["shop"])


@router.put("", response_model=schemas.ShopOut)
def update_shop(payload: schemas.ShopUpdateIn, shop: models.Shop = Depends(get_current_shop), db: Session = Depends(get_db)):
    if payload.shop_name is not None and payload.shop_name.strip():
        shop.shop_name = payload.shop_name.strip()
    if payload.owner_name is not None and payload.owner_name.strip():
        shop.owner_name = payload.owner_name.strip()
    if payload.language is not None:
        shop.language = payload.language
    if getattr(payload, 'upi_id', None) is not None:
        shop.upi_id = payload.upi_id.strip() if payload.upi_id else ""
    if getattr(payload, 'shop_photo', None) is not None:
        shop.shop_photo = payload.shop_photo or ""
    db.commit()
    db.refresh(shop)
    return shop

@router.get("", response_model=schemas.ShopOut)
def get_shop(shop: models.Shop = Depends(get_current_shop)):
    return shop
