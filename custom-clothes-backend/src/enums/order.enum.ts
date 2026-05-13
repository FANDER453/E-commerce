export enum OrderStatus{
    PENDING = 'В ожидании подтверждения',
    CONFIRMED = 'Подтверждён продавцом',
    PAID = 'Оплачен',
    PACKING = 'Собирается',
    SHIPPED = 'Отправлен',
    DELIVERING = 'Доставлен',
    CANCELLED = 'Отменён',
    REFUNDED = 'Возврат денег',
}