import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import api from '../../services/api';

import Container from '../../components/Container/index';

import {
  Loading,
  Owner,
  IssueList,
  FilterButton,
  Page,
  PageButton,
} from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    filterIssues: [
      { state: 'open', active: true, text: 'Abertos' },
      { state: 'closed', active: false, text: 'Fechados' },
      { state: 'all', active: false, text: 'Todos' },
    ],
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;

    const { filterIssues, page } = this.state;

    const getFilterActive = filterIssues.filter(x => x.active === true);

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: getFilterActive.state,
          per_page: 5,
          page,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  handleFilterChange = async e => {
    e.preventDefault();

    const { filterIssues, page } = this.state;
    const { match } = this.props;
    const verifyFilterSelected = filterIssues.some(
      x => x.state === e.target.value && x.active
    );

    if (verifyFilterSelected) return;

    const updateFilter = filterIssues.map(filterIssue => ({
      ...filterIssue,
      active: filterIssue.state === e.target.value,
    }));

    this.setState({ loading: true, filterIssues: updateFilter });

    const repoName = decodeURIComponent(match.params.repository);

    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: e.target.value,
        per_page: 5,
        page,
      },
    });

    this.setState({
      issues: issues.data,
      loading: false,
      page: 1,
    });
  };

  handleChangePage = async e => {
    const { match } = this.props;
    const repoName = decodeURIComponent(match.params.repository);

    const { filterIssues, page } = this.state;

    const newPage = e === 'prev' ? page - 1 : page + 1;

    this.setState({
      page: newPage,
      loading: true,
    });

    const getStateFilter = filterIssues.find(x => x.active);

    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: getStateFilter.state,
        per_page: 5,
        page: newPage,
      },
    });

    this.setState({
      issues: issues.data,
      loading: false,
    });
  };

  render() {
    const { repository, issues, loading, filterIssues, page } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }
    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        <IssueList>
          <nav>
            <div>
              <strong>Filtros: </strong>
              {filterIssues.map(filter => (
                <FilterButton
                  key={filter.state}
                  value={filter.state}
                  active={filter.active}
                  onClick={this.handleFilterChange}
                >
                  {filter.text}
                </FilterButton>
              ))}
            </div>
          </nav>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <Page>
          <PageButton onClick={() => this.handleChangePage('prev')} page={page}>
            <FaArrowLeft color="#FFF" size={10} />
          </PageButton>

          <PageButton onClick={() => this.handleChangePage('next')}>
            <FaArrowRight color="#FFF" size={10} />
          </PageButton>
        </Page>
      </Container>
    );
  }
}
