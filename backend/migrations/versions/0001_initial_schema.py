"""Initial schema for Clinic Appointment Management System

Revision ID: 0001_initial_schema
Revises: None
Create Date: 2026-09-30 19:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column(
            'role',
            sa.Enum('PATIENT', 'DOCTOR', name='user_role'),
            nullable=False,
        ),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. patients table
    op.create_table(
        'patients',
        sa.Column('id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('address', sa.String(length=255), nullable=True),
    )

    # 3. doctors table
    op.create_table(
        'doctors',
        sa.Column('id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('specialization', sa.String(length=150), nullable=True),
        sa.Column('qualification', sa.String(length=150), nullable=True),
        sa.Column('experience_years', sa.Integer(), nullable=True),
        sa.Column('consultation_info', sa.String(length=255), nullable=True),
        sa.Column('photo_url', sa.String(length=500), nullable=True),
    )

    # 4. doctor_availability table
    op.create_table(
        'doctor_availability',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('doctor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('break_start', sa.Time(), nullable=True),
        sa.Column('break_end', sa.Time(), nullable=True),
        sa.Column('slot_duration_minutes', sa.Integer(), nullable=False, server_default='30'),
        sa.UniqueConstraint('doctor_id', 'day_of_week', name='uq_doctor_availability_day'),
        sa.CheckConstraint('day_of_week >= 0 AND day_of_week <= 6', name='ck_valid_day_of_week'),
        sa.CheckConstraint('start_time < end_time', name='ck_working_hours_order'),
    )
    op.create_index('ix_doctor_availability_doctor_id', 'doctor_availability', ['doctor_id'])

    # 5. doctor_unavailable_dates table
    op.create_table(
        'doctor_unavailable_dates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('doctor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=True),
        sa.UniqueConstraint('doctor_id', 'date', name='uq_doctor_unavailable_date'),
    )
    op.create_index('ix_doctor_unavailable_dates_doctor_id', 'doctor_unavailable_dates', ['doctor_id'])

    # 6. appointments table
    op.create_table(
        'appointments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('doctor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('appointment_date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column(
            'status',
            sa.Enum('BOOKED', 'CONFIRMED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', name='appointment_status'),
            nullable=False,
            server_default='BOOKED',
        ),
        sa.Column('reason_for_visit', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('ix_appointments_patient_id', 'appointments', ['patient_id'])
    op.create_index('ix_appointments_doctor_id', 'appointments', ['doctor_id'])
    op.create_index('ix_appointments_status', 'appointments', ['status'])
    op.create_index(
        'uq_active_appointment_slot',
        'appointments',
        ['doctor_id', 'appointment_date', 'start_time'],
        unique=True,
        postgresql_where=sa.text("status != 'CANCELLED'"),
    )

    # 7. medical_records table
    op.create_table(
        'medical_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('appointment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('doctor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('consultation_date', sa.Date(), nullable=False),
        sa.Column('symptoms', sa.Text(), nullable=True),
        sa.Column('diagnosis', sa.Text(), nullable=True),
        sa.Column('treatment', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('follow_up_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_medical_records_patient_id', 'medical_records', ['patient_id'])
    op.create_index('ix_medical_records_doctor_id', 'medical_records', ['doctor_id'])

    # 8. prescriptions table
    op.create_table(
        'prescriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('appointment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('appointments.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('doctor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('issued_date', sa.Date(), server_default=sa.func.current_date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_prescriptions_patient_id', 'prescriptions', ['patient_id'])
    op.create_index('ix_prescriptions_doctor_id', 'prescriptions', ['doctor_id'])

    # 9. prescription_items table
    op.create_table(
        'prescription_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('prescription_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('prescriptions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('medicine_name', sa.String(length=150), nullable=False),
        sa.Column('dosage', sa.String(length=100), nullable=True),
        sa.Column('frequency', sa.String(length=100), nullable=True),
        sa.Column('duration', sa.String(length=100), nullable=True),
        sa.Column('instructions', sa.String(length=500), nullable=True),
    )
    op.create_index('ix_prescription_items_prescription_id', 'prescription_items', ['prescription_id'])

    # 10. notifications table
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('related_appointment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('appointments.id', ondelete='SET NULL'), nullable=True),
        sa.Column(
            'type',
            sa.Enum('appointment_confirmation', 'appointment_cancellation', 'appointment_rescheduled', 'appointment_reminder', 'follow_up_reminder', name='notification_type'),
            nullable=False,
        ),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('message', sa.String(length=500), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('prescription_items')
    op.drop_table('prescriptions')
    op.drop_table('medical_records')
    op.drop_table('appointments')
    op.drop_table('doctor_unavailable_dates')
    op.drop_table('doctor_availability')
    op.drop_table('doctors')
    op.drop_table('patients')
    op.drop_table('users')
    op.execute('DROP TYPE IF EXISTS notification_type')
    op.execute('DROP TYPE IF EXISTS appointment_status')
    op.execute('DROP TYPE IF EXISTS user_role')
