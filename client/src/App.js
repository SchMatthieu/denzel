import React, { Component } from 'react';
import axios from 'axios';
import './App.css';

class App extends Component {
	constructor() {
		super();
		this.state = {
			title: '',
			link: '',
			metascore: '',
			poster: '',
			synopsis: '',
			review: ''
		};
		this.handleClick = this.handleClick.bind(this);
	}

	handleClick() {
		axios.get('http://localhost:9292/movies').then((response) =>
			this.setState({
				title: response.data.title,
				link: response.data.link,
				metascore: response.data.metascore,
				poster: response.data.poster,
				synopsis: response.data.synopsis,
				review: response.data.review
			})
		);
	}

	render() {
		return (
			<div class="center row">
				<div class="column">
					<img class="center" src={this.state.poster} />
				</div>
				<div class="column">
					<p>Titre : {this.state.title}</p>

					<p>Synopsis : {this.state.synopsis}</p>
					<p>Metascore : {this.state.metascore}</p>
					<p>Review : {this.state.review}</p>
					<p>
						Link :{' '}
						<a href={this.state.link} target="_blank">
							{this.state.link}
						</a>{' '}
					</p>
					<button className="button" onClick={this.handleClick}>
						Get Random Movie
					</button>
				</div>
			</div>
		);
	}
}

export default App;
