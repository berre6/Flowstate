
"""add cascade delete to tasks

Revision ID: 51519ef00544
Revises: 5db1d3d0d3a3
"""

from typing import Sequence, Union

from alembic import op


revision: str = "51519ef00544"
down_revision: Union[str, Sequence[str], None] = "5db1d3d0d3a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table(
        "tasks",
        naming_convention={
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s"
        },
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_tasks_user_id_users",
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
    with op.batch_alter_table(
        "tasks",
        naming_convention={
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s"
        },
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_tasks_user_id_users",
            type_="foreignkey",
        )
        batch_op.create_foreign_key(
            "fk_tasks_user_id_users",
            "users",
            ["user_id"],
            ["id"],
        )
