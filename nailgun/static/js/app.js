define(
[
    'models',
    'views/common',
    'views/cluster',
    'views/clusters',
    'views/release'
], function(models, commonViews, clusterViews, clustersViews, releaseViews) {
    var AppRouter = Backbone.Router.extend({
        routes: {
            'clusters': 'listClusters',
            'cluster/:id': 'showCluster',
            'cluster/:id/:tab': 'showClusterTab',
            'releases': 'listReleases',
            '*default': 'listClusters'
        },
        initialize: function() {
            this.content = $('#content');
            this.navbar = new commonViews.Navbar({elements: [
                ['OpenStack Installations', '#clusters'],
                ['Software Updates', '#releases']
            ]});
            this.content.before(this.navbar.render().el);
            this.breadcrumb = new commonViews.Breadcrumb();
            this.content.before(this.breadcrumb.render().el);
        },
        showCluster: function(id) {
            this.navigate('#cluster/' + id + '/nodes', {trigger: true, replace: true});
        },
        showClusterTab: function(id, tab) {
            var tabs = ['nodes', 'network', 'settings'];
            if (!_.contains(tabs, tab)) {
                this.showCluster(id);
                return;
            }

            var cluster, settings = {};

            function render() {
                this.navbar.setActive('clusters');
                this.breadcrumb.setPath(['Home', '#'], ['OpenStack Installations', '#clusters'], cluster.get('name'));
                this.page = new clusterViews.ClusterPage({model: cluster, tabs: tabs, tab: tab, settings: settings});
                this.content.html(this.page.render().el);
            }

            if (app.page && app.page.constructor == clusterViews.ClusterPage) {
                // just another tab has been chosen, do not load cluster again
                cluster = app.page.model;
                settings = app.page.settings;
                render.call(this);
            } else {
                cluster = new models.Cluster({id: id});
                cluster.fetch({
                    success: _.bind(render, this),
                    error: _.bind(function() {this.listClusters();}, this)
                });
                settings = new models.Settings();
                settings.fetch({
                    url: '/api/clusters/' + cluster.id + '/attributes'
                });
            }
        },
        listClusters: function() {
            this.navigate('#clusters', {replace: true});
            var clusters = new models.Clusters();
            clusters.fetch({
                success: _.bind(function() {
                    this.navbar.setActive('clusters');
                    this.breadcrumb.setPath(['Home', '#'], 'OpenStack Installations');
                    this.page = new clustersViews.ClustersPage({collection: clusters});
                    this.content.html(this.page.render().el);
                }, this)
            });
        },
        listReleases: function() {
            var releases = new models.Releases();
            releases.fetch({
                success: _.bind(function() {
                    this.navbar.setActive('releases');
                    this.breadcrumb.setPath(['Home', '#'], 'Software Updates');
                    this.page = new releaseViews.ReleasesPage({collection: releases});
                    this.content.html(this.page.render().el);
                }, this)
            });
        }
    });

    return {
        initialize: function() {
            window.app = new AppRouter();
            Backbone.history.start();
            $('body').tooltip({selector: "[rel=tooltip]"});
        }
    };
});
