from app import db
import datetime


class Table(db.Model):
    __tablename__ = "table_name"

    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(), comment="Name.")
    # _user = db.relationship("User", backref="project")
    created = db.Column(
        db.DateTime, nullable=False, default=datetime.datetime.now(datetime.UTC)
    )

    def __str__(self):
        # print(self.created)
        return self.name
