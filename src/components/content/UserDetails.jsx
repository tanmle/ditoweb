import React, { Component } from 'react';
import Prompt from '../router/Prompt'
import { connect } from 'react-redux';
import { withFirebase } from '../Firebase';
import { compose } from 'recompose';
import { toast } from 'react-toastify';
const Joi = require('joi-browser');

class UserDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorMessage: "",
      passwordMessage: "",
      player: {
        email: "",
        isDefaultJoin: "",
        name: "",
      },
      isChange: false,
      isPassChange: false,
      password: "",
      repassword: "",
      defaultAvatar:
        "/img/dito_tran.png",
      uploadProgress: 0,
    };
  }

  componentDidMount() {
    this.getPlayerInfo();
  }

  componentDidUpdate(prevProps) {
    if (this.state.isChange === true) {
      window.onbeforeunload = () => true;
    } else {
      window.onbeforeunload = undefined;
    }

    const prevUid = prevProps.stCurrentUser && prevProps.stCurrentUser.uid;
    const currentUid = this.props.stCurrentUser && this.props.stCurrentUser.uid;

    if (currentUid && prevUid !== currentUid) {
      this.getPlayerInfo();
    }
  }

  getPlayerInfo = async () => {
    if (this.props.stCurrentUser) {
      this.props.firebase
        .getRef("players/" + this.props.stCurrentUser.uid)
        .once("value", async (snap) => {
          if (!snap.exists()) {
            return;
          }

          await this.setState({
            player: snap.val(),
            id: snap.key,
            dow: snap.val().dow,
            name: snap.val().name,
            level: snap.val().level,
            email: snap.val().email,
            isDefaultJoin: snap.val().isDefaultJoin | 0,
            isMatchPaid: snap.val().isMatchPaid | 0,
            role: snap.val().role,
            defaultAvatar: await this.getCurrentUserAvatar(snap.val().avatar, snap.key),
            status: snap.val().status,
          });
        });
    }
  };

  getCurrentUserAvatar = async (avatarId, playerId) => {
    if (avatarId && /^https?:\/\//i.test(avatarId)) {
      return avatarId;
    }

    const candidateIds = [];
    if (avatarId) {
      candidateIds.push(avatarId);
    }
    if (playerId && avatarId !== playerId) {
      candidateIds.push(playerId);
    }

    for (const candidate of candidateIds) {
      try {
        const url = await this.props.firebase
          .getStorage()
          .ref("avatar")
          .child(candidate)
          .getDownloadURL();
        return url;
      } catch (error) {
        // Continue to the next candidate.
      }
    }

    if (avatarId) {
      return `/img/${avatarId}.png`;
    }

    return "/img/dito_tran.png";
  };

  onChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
      isChange: true,
    });
  };

  onPasswordChange = async (event) => {
    await this.setState({
      [event.target.name]: event.target.value,
      isPassChange: true,
    });
  };

  uploadAvatar = async (event) => {
    const uploadTask = this.props.firebase
      .getStorage()
      .ref(`avatar/${this.props.stCurrentUser.uid}`)
      .put(event.target.files[0]);
    toast.promise(uploadTask, {
      pending: "Uploading avatar....",
      success: {
        render() {
          return "Avatar uploaded successfully!";
        },
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      },
      error: "Uploading avatar failed 🤯",
    });
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        console.log('Uploading progress: ', progress);
      },
      (error) => {
        console.log(error);
      },
      async () => {
        await this.props.firebase
          .getRef("players/" + this.props.stCurrentUser.uid)
          .update({ avatar: this.props.stCurrentUser.uid });

        await this.setState({
          defaultAvatar: await this.props.firebase
            .getStorage()
            .ref("avatar")
            .child(this.props.stCurrentUser.uid)
            .getDownloadURL(),
        });
      }
    );
  };

  savePlayerInfo = async () => {
    this.setState({ errorMessage: "" });
    var data = {
      id: this.state.id,
      email: this.state.email,
      name: this.state.name,
      dow: this.state.dow,
      isMatchPay: this.state.isMatchPay | 0,
      level: this.state.level,
      role: this.state.role,
      status: this.state.status,
    };
    await this.setState({
      player: data,
    });

    const schema = Joi.object().keys({
      id: Joi.optional(),
      name: Joi.string().min(2).max(35).required(),
      level: Joi.number().min(1).max(5).required(),
      email: Joi.string().email().required(),
      dow: Joi.object().optional(),
      isMatchPay: Joi.number().min(0).max(1).optional(),
      role: Joi.number().min(0).max(1).required(),
      status: Joi.number().min(-1).max(1).required(),
    });
    const validateResult = Joi.validate(data, schema);

    if (validateResult.error === null) {
      await this.props.firebase
        .getRef("players/" + this.props.stCurrentUser.uid)
        .update(this.state.player, (error) => {
          if (error) {
            console.log(error);
          } else {
            this.setState({ isChange: false, errorMessage: "" });
            toast.success("Saved!", {
              position: "top-right",
              autoClose: 1000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
          }
        });
    } else {
      var msg = validateResult.error.message.substring(
        validateResult.error.message
      );
      this.setState({ ...this.state, errorMessage: msg });
    }
  };

  showErrorMessage = (msg) => {
    if (msg !== undefined && msg !== null && msg !== "") {
      return <p className="text-xs text-danger">{msg}</p>;
    }
  };

  changePassword = () => {
    if (this.state.repassword === this.state.password) {
      var data = { password: this.state.password };
      const schema = Joi.object().keys({
        password: Joi.string().min(6).max(16).required(),
      });
      const validateResult = Joi.validate(data, schema);

      if (validateResult.error === null) {
        this.props.firebase
          .doPasswordUpdate(this.state.password)
          .then(() => {
            this.setState({
              password: "",
              repassword: "",
              passwordMessage: "Password is updated!",
            });
            toast.success("Password changed successfully!", {
              position: "top-right",
              autoClose: 1000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
          })
          .catch((error) => {
            this.setState({ passwordMessage: msg });
          });
      } else {
        var msg = validateResult.error.message;
        this.setState({ ...this.state, passwordMessage: msg });
      }
    } else {
      this.setState({ passwordMessage: "Password doesn't match" });
    }
  };

  setDayJoin = async (event) => {
    await this.setState({
      dow: { ...this.state.dow, [event.target.name]: event.target.checked },
      isChange: true,
    });
  };

  DefaultDate = () => {
    if (this.state.dow) {
      return (
        <div className="form-check form-check-inline">
          <label className="form-check-label mr-3">
            <input
              className="form-check-input mr-0"
              type="checkbox"
              onChange={(event) => this.setDayJoin(event)}
              name="1"
              defaultChecked={this.state.dow ? this.state.dow[1] : false}
            />{" "}
            Mon
          </label>
          <label className="form-check-label mr-3">
            <input
              className="form-check-input mr-0"
              type="checkbox"
              onChange={(event) => this.setDayJoin(event)}
              name="2"
              defaultChecked={this.state.dow ? this.state.dow[2] : false}
            />{" "}
            Tue
          </label>
          <label className="form-check-label mr-3">
            <input
              className="form-check-input mr-0"
              type="checkbox"
              onChange={(event) => this.setDayJoin(event)}
              name="3"
              defaultChecked={this.state.dow ? this.state.dow[3] : false}
            />{" "}
            Wed
          </label>
          <label className="form-check-label mr-3">
            <input
              className="form-check-input mr-0"
              type="checkbox"
              onChange={(event) => this.setDayJoin(event)}
              name="4"
              defaultChecked={this.state.dow ? this.state.dow[4] : false}
            />{" "}
            Thu
          </label>
          <label className="form-check-label mr-3">
            <input
              className="form-check-input mr-0"
              type="checkbox"
              onChange={(event) => this.setDayJoin(event)}
              name="5"
              defaultChecked={this.state.dow ? this.state.dow[5] : false}
            />{" "}
            Fri
          </label>
          <label className="form-check-label mr-3">
            <input
              className="form-check-input mr-0"
              type="checkbox"
              onChange={(event) => this.setDayJoin(event)}
              name="6"
              defaultChecked={this.state.dow ? this.state.dow[6] : false}
            />{" "}
            Sat
          </label>
          <label className="form-check-label mr-3">
            <input
              className="form-check-input mr-0"
              type="checkbox"
              onChange={(event) => this.setDayJoin(event)}
              name="7"
              defaultChecked={this.state.dow ? this.state.dow[7] : false}
            />{" "}
            Sun
          </label>
        </div>
      );
    }
  };
  render() {
    return (
      <React.Fragment>
        <Prompt
          when={this.state.isChange === true}
          message="You have unsaved changes, are you sure you want to leave?"
        />
        <div className="container-fluid">
          {/* Page Heading */}
          <div className="d-sm-flex align-items-center justify-content-between mb-3">
            <h1 className="h3 mb-0 text-gray-800">Your Information</h1>
          </div>

          {/* match settings */}
          <div className="d-sm-flex align-items-center justify-content-between mb-3">
            <h1 className="h5 mb-0 text-gray-800">Info</h1>
          </div>
          <div className="row ml-1 justify-content-center">
            <div className="col-9">
              <label htmlFor="fileUpload">
                <img
                  src={this.state.defaultAvatar}
                  alt="Avatar"
                  className="avatar"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "/img/dito_tran.png";
                  }}
                />
              </label>
              <input
                id="fileUpload"
                type="file"
                onChange={this.uploadAvatar}
                style={{ display: "none" }}
              />
            </div>
          </div>
          <div className="row ml-1">
            <div className="col-lg-1">
              <label>Name</label>
            </div>
            <div className="col-lg-3 col-md-3 col-sm-8">
              <input
                type="text"
                className="form-control-userdetail"
                onChange={(event) => this.onChange(event)}
                name="name"
                key={this.state.player.name}
                defaultValue={this.state.player.name}
              />
            </div>
          </div>
          <div className="row ml-1">
            <div className="col-lg-1">
              <label>Email</label>
            </div>
            <div className="col-lg-3 col-md-3 col-sm-8">
              <input
                type="text"
                className="form-control-userdetail"
                onChange={(event) => this.onChange(event)}
                name="email"
                key={this.state.player.email}
                defaultValue={this.state.player.email}
              />
            </div>
          </div>

          {/* Default dow join */}
          <div className="d-sm-flex align-items-center justify-content-between mt-3 mb-2">
            <h1 className="h6 mb-0 text-gray-800">Default Day</h1>
          </div>
          <div className="row ml-1 mb-2">{this.DefaultDate()}</div>
          <div className="row ml-1">
            {this.showErrorMessage(this.state.errorMessage)}
          </div>
          <div className="row ml-1">
            <button
              type="button"
              disabled={!this.state.isChange}
              onClick={() => this.savePlayerInfo()}
              className="btn btn-primary"
            >
              <i className="fas fa-save"></i> Save
            </button>
          </div>
          <hr />
          {/* Password change */}
          <div className="d-sm-flex align-items-center justify-content-between mb-3">
            <h1 className="h5 mb-0 text-gray-800">Change Password</h1>
          </div>
          <div className="row ml-1">
            <div className="col-lg-1">
              <label>New</label>
            </div>
            <div className="col-lg-3 col-md-3 col-sm-8">
              <input
                type="password"
                className="form-control-userdetail"
                onChange={(event) => this.onPasswordChange(event)}
                name="password"
              />
            </div>
          </div>
          <div className="row ml-1">
            <div className="col-lg-1">
              <label>Re enter</label>
            </div>
            <div className="col-lg-3 col-md-3 col-sm-8">
              <input
                type="password"
                className="form-control-userdetail"
                onChange={(event) => this.onPasswordChange(event)}
                name="repassword"
              />
            </div>
          </div>

          <div className="row ml-1">
            {this.showErrorMessage(this.state.passwordMessage)}
          </div>
          <div className="row ml-1 mt-2">
            <button
              type="button"
              disabled={!this.state.isPassChange}
              onClick={() => this.changePassword()}
              className="btn btn-primary"
            >
              <i className="fas fa-key"></i> Change
            </button>
          </div>
          <hr />
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stCurrentUser: state.currentUser
    }
}


const reduxConnectExport = connect(mapStateToProps)(UserDetails)
export default compose(withFirebase)(reduxConnectExport)
