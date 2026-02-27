import React, { Component } from 'react';

class PlayerAvatar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            avatarSrc: "/img/dito_tran.png"
        }
    }

    componentDidMount() {
        this.checkAvatar();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.avatarValue !== this.props.avatarValue || prevProps.playerId !== this.props.playerId) {
            this.checkAvatar();
        }
    }

    checkAvatar = async () => {
        const { firebase, playerId, avatarValue } = this.props;

        if (!avatarValue && !playerId) {
            this.setState({ avatarSrc: "/img/dito_tran.png" });
            return;
        }

        if (avatarValue && /^https?:\/\//i.test(avatarValue)) {
            this.setState({ avatarSrc: avatarValue });
            return;
        }

        const candidateIds = [];
        if (avatarValue) {
            candidateIds.push(avatarValue);
        }
        if (playerId && avatarValue !== playerId) {
            candidateIds.push(playerId);
        }

        const cacheKey = `avatar_url_${candidateIds.join('_')}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            const { url, timestamp } = JSON.parse(cachedData);
            const now = new Date().getTime();
            // Cache valid for 24 hours
            if (now - timestamp < 24 * 60 * 60 * 1000) {
                this.setState({ avatarSrc: url });
                return;
            }
        }

        try {
            for (const candidate of candidateIds) {
                const url = await firebase.getStorage()
                    .ref("avatar")
                    .child(candidate)
                    .getDownloadURL();

                this.setState({ avatarSrc: url });

                localStorage.setItem(cacheKey, JSON.stringify({
                    url: url,
                    timestamp: new Date().getTime()
                }));
                return;
            }
        } catch (error) {
            if (avatarValue) {
                this.setState({ avatarSrc: `/img/${avatarValue}.png` });
                return;
            }

            this.setState({ avatarSrc: "/img/dito_tran.png" });
        }
    }

    render() {
        const { style, className } = this.props;
        return (
            <img 
                src={this.state.avatarSrc} 
                alt="avatar" 
                className={className}
                style={style || { width: '30px', height: '30px', borderRadius: '50%' }} 
                onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = '/img/dito_tran.png';
                }}
            />
        );
    }
}

export default PlayerAvatar;
