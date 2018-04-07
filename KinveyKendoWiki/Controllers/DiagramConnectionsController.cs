using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using EleMech_Wiki_5.Models;
using EleMech_Wiki_5.Common;
using System.Web.Script.Serialization;
using EleMech_Wiki_5.Models.EF;

namespace EleMech_Wiki_5.Controllers
{
    public class DiagramConnectionsController : Controller
    {
        public ActionResult Index()
        {
            return this.Jsonp(DiagramConnectionsRepository.All());
        }

        public JsonResult Update()
        {
            var models = this.DeserializeObject<IEnumerable<OrgChartConnection>>("models");
            if (models != null)
            {
                DiagramConnectionsRepository.Update(models);
            }
            return this.Jsonp(models);
        }

        public ActionResult Destroy()
        {
            var models = this.DeserializeObject<IEnumerable<OrgChartConnection>>("models");

            if (models != null)
            {
                DiagramConnectionsRepository.Delete(models);
            }
            return this.Jsonp(models);
        }

        public ActionResult Create()
        {
            var models = this.DeserializeObject<IEnumerable<OrgChartConnection>>("models");
            if (models != null)
            {
                DiagramConnectionsRepository.Insert(models);
            }
            return this.Jsonp(models);
        }
    }
}
