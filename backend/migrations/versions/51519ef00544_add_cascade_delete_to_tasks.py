
"""add cascade delete to tasks

Revision ID: 51519ef00544
Revises: 5db1d3d0d3a3
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "51519ef00544"
down_revision: Union[str, Sequence[str], None] = "5db1d3d0d3a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_foreign_key_name() -> str:
    inspector = sa.inspect(op.get_bind())

    foreign_keys = inspector.get_foreign_keys("tasks")

    for foreign_key in foreign_keys:
        if (
            foreign_key["constrained_columns"] == ["user_id"]
            and foreign_key["referred_table"] == "users"
        ):
            return foreign_key["name"] or "fk_tasks_user_id_users"

    raise RuntimeError(
        "Could not find the tasks.user_id foreign key."
    )


def upgrade() -> None:
    foreign_key_name = _get_foreign_key_name()

    with op.batch_alter_table(
        "tasks",
        naming_convention={
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s"
        },
    ) as batch_op:
        batch_op.drop_constraint(
            foreign_key_name,
            type_="foreignkey",
        )
        batch_op.create_foreign_key(
            "fk_tasks_user_id_users",
            "users",
            ["user_id"],
            ["id"],
            ondelete="CASCADE",
        )


def downgrade() -> None:
    foreign_key_name = _get_foreign_key_name()

    with op.batch_alter_table(
        "tasks",
        naming_convention={
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s"
        },
    ) as batch_op:
        batch_op.drop_constraint(
            foreign_key_name,
            type_="foreignkey",
        )
        batch_op.create_foreign_key(
            "fk_tasks_user_id_users",
            "users",
            ["user_id"],
            ["id"],
        )
