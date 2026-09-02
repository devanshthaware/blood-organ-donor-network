from enum import IntEnum
from pydantic import BaseModel, Field, field_validator, model_validator


class BloodGroup(IntEnum):
    """Blood group encoding"""
    O_NEGATIVE = 0
    O_POSITIVE = 1
    A_NEGATIVE = 2
    A_POSITIVE = 3
    B_NEGATIVE = 4
    B_POSITIVE = 5
    AB_NEGATIVE = 6
    AB_POSITIVE = 7


class UrgencyLevel(IntEnum):
    """Urgency level encoding"""
    LOW = 0
    MEDIUM = 1
    HIGH = 2
    CRITICAL = 3


class TimeOfDay(IntEnum):
    """Time of day encoding"""
    MORNING = 0
    AFTERNOON = 1
    EVENING = 2
    NIGHT = 3


class ReliabilityRequest(BaseModel):
    total_requests: int = Field(..., ge=0, le=10000, description="Total number of donation requests")
    accepted_requests: int = Field(..., ge=0, le=10000, description="Number of accepted requests")
    completed_donations: int = Field(..., ge=0, le=10000, description="Number of completed donations")
    no_shows: int = Field(..., ge=0, le=10000, description="Number of no-shows")
    avg_response_time_minutes: float = Field(..., ge=0.0, le=1440.0, description="Average response time in minutes")

    @model_validator(mode='after')
    def validate_logical_constraints(self):
        if self.accepted_requests > self.total_requests:
            raise ValueError("accepted_requests cannot exceed total_requests")
        if self.completed_donations > self.accepted_requests:
            raise ValueError("completed_donations cannot exceed accepted_requests")
        if self.no_shows > self.accepted_requests:
            raise ValueError("no_shows cannot exceed accepted_requests")
        if self.completed_donations + self.no_shows > self.accepted_requests:
            raise ValueError("completed_donations + no_shows cannot exceed accepted_requests")
        return self


class DemandRequest(BaseModel):
    region: int = Field(..., ge=0, le=100, description="Encoded region identifier")
    blood_group: BloodGroup = Field(..., description="Blood group")
    demand_units: int = Field(..., ge=0, le=10000, description="Current demand in units")
    supply_units: int = Field(..., ge=0, le=10000, description="Current supply in units")
    month: int = Field(..., ge=1, le=12, description="Month of the year (1-12)")
    day: int = Field(..., ge=1, le=31, description="Day of the month (1-31)")

    @field_validator('day')
    @classmethod
    def validate_day_for_month(cls, v, info):
        month = info.data.get('month')
        if month:
            days_in_month = {
                1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
                7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
            }
            max_days = days_in_month.get(month, 31)
            if v > max_days:
                raise ValueError(f"Day {v} is invalid for month {month}")
        return v

    def model_dump(self, **kwargs):
        """Override to convert enums to integers for model compatibility"""
        # Use mode='python' to get Python native types, then convert enums
        kwargs.setdefault('mode', 'python')
        data = super().model_dump(**kwargs)
        # Convert enums to their integer values for model inference
        if isinstance(data.get('blood_group'), BloodGroup):
            data['blood_group'] = data['blood_group'].value
        return data

    def dict(self, **kwargs):
        """Alias for model_dump for backward compatibility"""
        return self.model_dump(**kwargs)


class AvailabilityRequest(BaseModel):
    blood_group: BloodGroup = Field(..., description="Blood group")
    distance_km: float = Field(..., ge=0.0, le=1000.0, description="Distance to donation center in kilometers")
    days_since_last_donation: int = Field(..., ge=0, le=365, description="Days since last donation")
    past_acceptance_rate: float = Field(..., ge=0.0, le=1.0, description="Historical acceptance rate (0.0 to 1.0)")
    urgency_level: UrgencyLevel = Field(..., description="Urgency level of the request")
    time_of_day: TimeOfDay = Field(..., description="Time of day identifier")

    def model_dump(self, **kwargs):
        """Override to convert enums to integers for model compatibility"""
        # Use mode='python' to get Python native types, then convert enums
        kwargs.setdefault('mode', 'python')
        data = super().model_dump(**kwargs)
        # Convert enums to their integer values for model inference
        if isinstance(data.get('blood_group'), BloodGroup):
            data['blood_group'] = data['blood_group'].value
        if isinstance(data.get('urgency_level'), UrgencyLevel):
            data['urgency_level'] = data['urgency_level'].value
        if isinstance(data.get('time_of_day'), TimeOfDay):
            data['time_of_day'] = data['time_of_day'].value
        return data

    def dict(self, **kwargs):
        """Alias for model_dump for backward compatibility"""
        return self.model_dump(**kwargs)


class OrganCompatibilityRequest(BaseModel):
    organ_type: str = Field(..., description="Organ type (e.g. KIDNEY, LIVER)")
    donor_blood: str = Field(..., description="Donor ABO blood group")
    recipient_blood: str = Field(..., description="Recipient ABO blood group")
    urgency: str = Field(..., description="Recipient urgency tier")
    distance_km: float = Field(..., ge=0.0, le=5000.0, description="Logistical distance in km")
    remaining_preservation_hours: float = Field(..., ge=0.0, le=120.0, description="Remaining cold ischemia time in hours")


class OrganCompatibilityResponse(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0, description="Predicted multi-factor compatibility score")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model prediction confidence")
    model_version: str = Field(..., description="Active ML inference model version")
    features: dict = Field(default_factory=dict, description="Normalized feature weights")
    explanation: str = Field(..., description="Brief ML inference summary")

