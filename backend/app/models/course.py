from datetime import datetime, timezone
from ..extensions import db


class Course(db.Model):
    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    # Categories: convert, missionary, discipleship, other
    category = db.Column(db.String(50), nullable=False, default="other")
    price = db.Column(db.Float, default=0.0)
    is_free = db.Column(db.Boolean, default=True)
    thumbnail = db.Column(db.String(255))
    is_published = db.Column(db.Boolean, default=False)
    requires_approval = db.Column(db.Boolean, default=False)
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))

    # Relationships
    lessons = db.relationship(
        "Lesson", back_populates="course", lazy="dynamic",
        order_by="Lesson.order", cascade="all, delete-orphan"
    )
    enrollments = db.relationship(
        "Enrollment", back_populates="course", lazy="dynamic",
        cascade="all, delete-orphan"
    )
    certificates = db.relationship(
        "Certificate", back_populates="course", lazy="dynamic",
        cascade="all, delete-orphan"
    )

    @property
    def lesson_count(self):
        return self.lessons.count()

    @property
    def enrollment_count(self):
        return self.enrollments.count()

    def to_dict(self, include_lessons=False):
        data = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "price": self.price,
            "is_free": self.is_free,
            "thumbnail": self.thumbnail,
            "is_published": self.is_published,
            "requires_approval": self.requires_approval,
            "order": self.order,
            "lesson_count": self.lesson_count,
            "enrollment_count": self.enrollment_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_lessons:
            data["lessons"] = [l.to_dict() for l in self.lessons.order_by(Lesson.order)]
        return data

    def __repr__(self):
        return f"<Course {self.title}>"


class Lesson(db.Model):
    __tablename__ = "lessons"

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)
    # Content types: video, audio, pdf, word, txt, image, text
    content_type = db.Column(db.String(30), nullable=False, default="text")
    content_url = db.Column(db.String(500))   # file path or URL
    content_text = db.Column(db.Text)          # for text lessons
    duration = db.Column(db.Integer)           # seconds (for video/audio)
    is_preview = db.Column(db.Boolean, default=False)  # free preview for paid courses
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    course = db.relationship("Course", back_populates="lessons")
    progress_records = db.relationship(
        "LessonProgress", back_populates="lesson", lazy="dynamic",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "course_id": self.course_id,
            "title": self.title,
            "description": self.description,
            "order": self.order,
            "content_type": self.content_type,
            "content_url": self.content_url,
            "content_text": self.content_text,
            "duration": self.duration,
            "is_preview": self.is_preview,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Lesson {self.title}>"


class Enrollment(db.Model):
    __tablename__ = "enrollments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime)
    is_approved = db.Column(db.Boolean, default=True)  # for courses requiring approval
    payment_status = db.Column(db.String(20), default="pending")  # pending, paid, free
    payment_ref = db.Column(db.String(100))

    # Relationships
    user = db.relationship("User", back_populates="enrollments")
    course = db.relationship("Course", back_populates="enrollments")

    __table_args__ = (
        db.UniqueConstraint("user_id", "course_id", name="unique_enrollment"),
    )

    @property
    def progress(self):
        total = self.course.lesson_count
        if total == 0:
            return 0
        completed = LessonProgress.query.filter_by(
            user_id=self.user_id, completed=True
        ).join(Lesson).filter(Lesson.course_id == self.course_id).count()
        return round((completed / total) * 100)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "course_id": self.course_id,
            "course": self.course.to_dict() if self.course else None,
            "enrolled_at": self.enrolled_at.isoformat() if self.enrolled_at else None,
            "completed_at": (
                self.completed_at.isoformat() if self.completed_at else None
            ),
            "is_approved": self.is_approved,
            "payment_status": self.payment_status,
            "progress": self.progress,
        }

    def __repr__(self):
        return f"<Enrollment user={self.user_id} course={self.course_id}>"


class LessonProgress(db.Model):
    __tablename__ = "lesson_progress"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.id"), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)
    time_spent = db.Column(db.Integer, default=0)  # seconds

    # Relationships
    user = db.relationship("User", back_populates="lesson_progress")
    lesson = db.relationship("Lesson", back_populates="progress_records")

    __table_args__ = (
        db.UniqueConstraint("user_id", "lesson_id", name="unique_lesson_progress"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "lesson_id": self.lesson_id,
            "completed": self.completed,
            "completed_at": (
                self.completed_at.isoformat() if self.completed_at else None
            ),
            "time_spent": self.time_spent,
        }


class Certificate(db.Model):
    __tablename__ = "certificates"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    issued_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    certificate_url = db.Column(db.String(255))
    certificate_number = db.Column(db.String(50), unique=True)

    # Relationships
    user = db.relationship("User", back_populates="certificates")
    course = db.relationship("Course", back_populates="certificates")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "course_id": self.course_id,
            "course_title": self.course.title if self.course else None,
            "issued_at": self.issued_at.isoformat() if self.issued_at else None,
            "certificate_url": self.certificate_url,
            "certificate_number": self.certificate_number,
        }
