"""create blogs table

Revision ID: 20260519_0001
Revises:
Create Date: 2026-05-19
"""

from alembic import op
import sqlalchemy as sa


revision = "20260519_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "blogs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("slug", sa.String(length=260), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("summary", sa.String(length=500), nullable=False),
        sa.Column("image_url", sa.String(length=1000), nullable=False),
        sa.Column("author", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("published", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_blogs_id"), "blogs", ["id"], unique=False)
    op.create_index(op.f("ix_blogs_published"), "blogs", ["published"], unique=False)
    op.create_index(op.f("ix_blogs_slug"), "blogs", ["slug"], unique=True)
    op.create_index(op.f("ix_blogs_title"), "blogs", ["title"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_blogs_title"), table_name="blogs")
    op.drop_index(op.f("ix_blogs_slug"), table_name="blogs")
    op.drop_index(op.f("ix_blogs_published"), table_name="blogs")
    op.drop_index(op.f("ix_blogs_id"), table_name="blogs")
    op.drop_table("blogs")
